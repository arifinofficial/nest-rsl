# @fintastic/nest-rsl

Generic Repository + Service Layer base classes for NestJS.

Provides a strongly-typed CRUD framework with AutoMapper integration, paged search, audit fields, and response wrappers — so every NestJS module follows the same pattern.

## Installation

```bash
pnpm add @fintastic/nest-rsl
```

You also need these peer dependencies (already installed in a standard NestJS project):

```bash
pnpm add @automapper/classes @automapper/core @automapper/nestjs
pnpm add @nestjs/common @nestjs/core
pnpm add class-transformer class-validator
pnpm add reflect-metadata rxjs typeorm
```

## Setup

### 1. Register FrameworkModule in your root AppModule

```ts
import { FrameworkModule } from '@fintastic/nest-rsl'

@Module({
  imports: [FrameworkModule],
})
export class AppModule {}
```

### 2. Import reflect-metadata in main.ts

```ts
import 'reflect-metadata'
```

## Usage Pattern

Each NestJS module follows this structure:

### Entity

```ts
import { BaseEntity } from '@fintastic/nest-rsl'
import { AutoMap } from '@automapper/classes'
import { Column, Entity } from 'typeorm'

@Entity()
export class TodoEntity extends BaseEntity {
  @AutoMap()
  @Column()
  title: string
}
```

### DTO

```ts
import { BaseDto } from '@fintastic/nest-rsl'
import { AutoMap } from '@automapper/classes'

export class TodoDto extends BaseDto {
  @AutoMap()
  title: string
}
```

### Repository

```ts
import { BaseRepository } from '@fintastic/nest-rsl'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectMapper } from '@automapper/nestjs'
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Mapper } from '@automapper/core'

@Injectable()
export class TodoRepository extends BaseRepository<TodoEntity, TodoDto> {
  constructor(
    @InjectRepository(TodoEntity) repo: Repository<TodoEntity>,
    @InjectMapper() mapper: Mapper,
  ) {
    super(repo, mapper, TodoEntity, TodoDto)
  }
}
```

### Service

```ts
import { BaseService } from '@fintastic/nest-rsl'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TodoService extends BaseService<TodoEntity, TodoDto> {
  constructor(repo: TodoRepository) {
    super(repo)
  }
}
```

### Controller

```ts
import { BaseController, GenericRequest, GenericResponse } from '@fintastic/nest-rsl'
import { Controller, Post, Body, Get, Param } from '@nestjs/common'

@Controller('todo')
export class TodoController extends BaseController {
  constructor(private readonly service: TodoService) {
    super()
  }

  @Post()
  async create(@Body() dto: TodoDto) {
    const request = new GenericRequest<TodoDto>({ data: dto })
    const response = await this.service.insert(request)
    if (response.isError()) return this.getErrorJson(response)
    return this.getSuccessJson(response, response.data)
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const request = new GenericRequest<number>({ data: id })
    const response = await this.service.read(request)
    if (response.isError()) return this.getErrorJson(response)
    return this.getSuccessJson(response, response.data)
  }
}
```

### AutoMapper Profile

```ts
import { BaseMapperProfile } from '@fintastic/nest-rsl'
import { Injectable } from '@nestjs/common'
import { Mapper } from '@automapper/core'

@Injectable()
export class TodoProfile extends BaseMapperProfile {
  get profile() {
    return (mapper: Mapper) => {
      this.createBaseMappings(mapper, TodoEntity, TodoDto)
    }
  }
}
```

### Entities and DTOs without audit fields

`BaseRepository` and `BaseService` only require an `id`:

```ts
BaseRepository<Entity extends { id: IdType }, Dto extends { id: IdType }, IdType = number>
```

An entity and DTO do not have to extend `BaseEntity` / `BaseDto`. This also lets you use string ids:

```ts
import { AutoMap } from '@automapper/classes'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class TagEntity {
  @AutoMap()
  @PrimaryColumn({ type: 'varchar' })
  id!: string

  @AutoMap()
  @Column()
  name!: string
}

export class TagDto {
  @AutoMap()
  id!: string

  @AutoMap()
  name!: string
}

export class TagRepository extends BaseRepository<TagEntity, TagDto, string> {}
```

Do not use `createBaseMappings` for these types. It maps `createdBy`, `createdDateTime`, `lastModifiedBy`
and `lastModifiedDateTime`, so on an entity without those members the mapped values come out as
`undefined`. Call `createMap` from `@automapper/core` directly, once for each direction the repository uses:

```ts
import { BaseMapperProfile } from '@fintastic/nest-rsl'
import { Injectable } from '@nestjs/common'
import { createMap, Mapper } from '@automapper/core'

@Injectable()
export class TagProfile extends BaseMapperProfile {
  get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, TagEntity, TagDto)
      createMap(mapper, TagDto, TagEntity)
    }
  }
}
```

### Soft-delete

By default `delete` removes the row. To make it a soft-delete, set `softDeleteColumn` in the repository
to the **property name** of a boolean column on the entity (`false` means live, `true` means deleted):

```ts
@Entity()
export class TodoEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  id!: number

  @AutoMap()
  @Column()
  title!: string

  @AutoMap()
  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean
}

@Injectable()
export class TodoRepository extends BaseRepository<TodoEntity, TodoDto> {
  protected override readonly softDeleteColumn = 'isDeleted'

  constructor(
    @InjectRepository(TodoEntity) repo: Repository<TodoEntity>,
    @InjectMapper() mapper: Mapper,
  ) {
    super(repo, mapper, TodoEntity, TodoDto)
  }
}
```

The column must be `NOT NULL` with a database default of `false`: `insert` and `bulkInsert` do not set it,
and a `NULL` row does not match the `= false` live check.

| Method | Behaviour with `softDeleteColumn` set |
|--------|---------------------------------------|
| `read(id)` | Finds only live rows. |
| `update(dto)` | Returns `null` if the row is missing or deleted. Writes only live rows and never changes the soft-delete column, even if the DTO carries it. Reloads only live rows. |
| `delete(id)` | Finds the live row, sets the column to `true` without writing any other DTO field, and returns the DTO as it was before. TypeORM's automatic `@UpdateDateColumn` still updates. |
| `pagedSearch(p)` | Adds `entity.<column> = false` to the query. `totalCount` excludes deleted rows, also with `pageSize: -1`. |
| `hardDelete(id)` | Finds the row whether deleted or not, removes it, and returns its DTO as it was. |
| `insert`, `bulkInsert` | Unchanged. The database default sets the column. |

Without `softDeleteColumn`, every method behaves as in 0.1.0 and `hardDelete` is the same as `delete`.

`update` never changes the soft-delete column: a DTO with `isDeleted: true` or `false` does not delete or
restore the row. Use `delete` or `hardDelete` to remove it.

Without `softDeleteColumn`, `delete` delegates to `hardDelete`. A subclass that overrides `hardDelete`
therefore changes `delete` too, and its `hardDelete` must not call `super.delete` (that would loop forever).

`BaseService` has a matching `hardDelete(request)`. It mirrors `delete` and returns the same messages
(`Item not found for deletion` / `Data deleted successfully`).

The soft-delete condition is combined with the keyword condition and with server-side filters as
`(keyword) AND (filters) AND (soft-delete)`. The keyword and filter conditions are each wrapped in brackets, so an `OR` in your
`getKeywordSearchCondition` cannot let deleted rows through.

### Paged search

`BaseService.pagedSearch(request)` takes a `PagedSearchRequest` (`pageIndex`, `pageSize`, `orderByFieldName`,
`sortOrder`, `keyword`) and returns a `GenericPagedSearchResponse` (`dtoCollection`, `totalCount`).
`pageSize: -1` returns all rows.

Add this to the controller from above:

```ts
@Post('search')
async search(@Body() request: PagedSearchRequest) {
  const response = await this.service.pagedSearch(request)
  if (response.isError()) return this.getErrorJson(response)
  return this.getPagedSearchGridJson(
    request.pageIndex,
    request.pageSize,
    response.dtoCollection,
    response.totalCount,
  )
}
```

#### Keyword search

Override `getKeywordSearchCondition` in the repository. Use the `:keyword` parameter. It is bound to
`%<keyword>%`. The default condition is `'1=1'`.

```ts
protected override getKeywordSearchCondition(_keyword: string): string {
  return 'entity.title LIKE :keyword'
}
```

#### Sorting

`orderByFieldName` must be the property name of a top-level column of the entity. It is checked,
case-sensitive, against the TypeORM metadata. Embedded and relation paths are not supported and are
rejected. An invalid name makes `BaseService.pagedSearch` return the error message
`Invalid orderByFieldName: <name>` without running a query, so a controller using `getErrorJson` answers
400. The repository also exposes `isSortableField(name)` for your own checks, and calling
`BaseRepository.pagedSearch` directly with an invalid name throws an `Error` with the same message.
Without `orderByFieldName`, results are sorted by `id`.

#### Server-side filters

`filters` and `filtersVariable` are no longer accepted from the request. They stay on
`PagedSearchParameter`, which only your server code builds. To filter, override
`getPagedSearchParameter` in the service:

```ts
import { BaseService, PagedSearchParameter, PagedSearchRequest } from '@fintastic/nest-rsl'

@Injectable()
export class TodoService extends BaseService<TodoEntity, TodoDto> {
  constructor(repo: TodoRepository) {
    super(repo)
  }

  protected override getPagedSearchParameter(request: PagedSearchRequest): PagedSearchParameter {
    const parameter = super.getPagedSearchParameter(request)
    parameter.filters = 'entity.title LIKE :prefix'
    parameter.filtersVariable = { prefix: 'Buy%' }
    return parameter
  }
}
```

Rules for server-side filters:

- `filters` is a SQL condition on the `entity` alias, and `filtersVariable` holds its named parameters.
  Pass every value that comes from a user through `filtersVariable`. Never concatenate it into `filters`.
- Do not use the parameter names `keyword` or `__rslSoftDeleteLive` in `filtersVariable`. The base query
  already binds them.

A request that still carries `filters` or `filtersVariable` is rejected with
`FrameworkConstants.Messages.FiltersNotAccepted`:

> filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)

With a `ValidationPipe` (whitelisting or not) the pipe answers 400. Without a pipe, `BaseService.pagedSearch`
returns an error response without querying. See [CHANGELOG.md](CHANGELOG.md#migrating-from-01).

### NestJS 12 and pnpm

`@automapper/nestjs` 9 declares a peer range of `@nestjs/* ^10 || ^11`. On NestJS 12 with pnpm, allow it
in `pnpm-workspace.yaml` (pnpm 12 reads `peerDependencyRules` from there):

```yaml
peerDependencyRules:
  allowedVersions:
    "@automapper/nestjs>@nestjs/common": "12"
    "@automapper/nestjs>@nestjs/core": "12"
```

NestJS 12 and `@automapper/nestjs` 9 are ESM only (TypeORM 1.x ships both CJS and ESM); NestJS 10/11 on CommonJS keeps working
(see [Supported versions](#supported-versions)).

### Using DateTransformInterceptor

Apply globally or per-controller to convert UTC dates to the user's timezone (passed via `X-Timezone` request header):

```ts
import { DateTransformInterceptor } from '@fintastic/nest-rsl'
import { UseInterceptors } from '@nestjs/common'

@UseInterceptors(DateTransformInterceptor)
@Controller('todo')
export class TodoController extends BaseController { ... }
```

## Available Exports

| Export | Description |
|--------|-------------|
| `BaseEntity` | Abstract TypeORM entity with audit fields (id, createdBy, createdDateTime, lastModifiedBy, lastModifiedDateTime) |
| `BaseDto` | Abstract DTO with audit fields |
| `BaseRepository` | Generic CRUD + paged search (insert, read, update, delete, hardDelete, pagedSearch, isSortableField, bulkInsert). Opt-in soft-delete via `softDeleteColumn`. |
| `BaseService` | Business logic layer wrapping repository operations (insert, read, update, delete, hardDelete, pagedSearch, bulkInsert) |
| `BaseController` | HTTP response helpers (getSuccessJson, getErrorJson, getPagedSearchGridJson, populateAuditFields*) |
| `BaseMapperProfile` | AutoMapper profile base with `createBaseMappings()` helper |
| `FrameworkModule` | NestJS global module — registers AutoMapper. Import once in AppModule. |
| `GenericRequest<T>` | Request wrapper: `new GenericRequest({ data: myDto })` |
| `GenericResponse<T>` | Response wrapper with error/info message collection |
| `GenericPagedSearchResponse<T>` | Paged search response (`dtoCollection`, `totalCount`) |
| `PagedSearchRequest` | Validated paged search request (pageIndex, pageSize, orderByFieldName, sortOrder, keyword) |
| `BasicResponse` | Base response class with `isError()`, `addErrorMessage()`, `addInfoMessage()` |
| `DateTransformInterceptor` | Converts UTC Date objects to user's timezone string (reads `X-Timezone` header) |
| `FrameworkConstants` | `SortOrder.Ascending` / `SortOrder.Descending`, `Messages.FiltersNotAccepted` |
| `MessageType` | Enum: `Error` / `Info` / `Warning` |
| `PagedSearchParameter` | Paged search model with `fromRequest()` factory. Server code can set `filters` / `filtersVariable` on it. |
| `PagedSearchResult<T>` | Internal result type: `{ count, result[] }` |
| `Message` | Internal message model: `{ messageText, type }` |

## Supported versions

| Stack | Status |
|-------|--------|
| NestJS 12, `@automapper/*` 9, TypeORM 1.x (ESM) | Tested with Vitest |
| NestJS 11, `@automapper/*` 8, TypeORM 0.3 (CommonJS) | Tested by loading the packed tarball in a separate fixture |

The package ships both CJS and ESM builds. Peer ranges are `@nestjs/* >=10`, `@automapper/* >=8` and
`typeorm >=0.3`.

## Upgrading

See [CHANGELOG.md](CHANGELOG.md). 0.2.0 closes a SQL injection in 0.1.0 and rejects `filters` from requests.

## License

MIT
