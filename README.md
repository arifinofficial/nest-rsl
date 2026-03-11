# @geraldine/nestjs

.NET-inspired Generic Repository + Service Layer base classes for NestJS.

Provides a strongly-typed CRUD framework with AutoMapper integration, paged search, audit fields, and response wrappers — so every NestJS module follows the same pattern.

## Installation

```bash
pnpm add @geraldine/nestjs
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
import { FrameworkModule } from '@geraldine/nestjs'

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
import { BaseEntity } from '@geraldine/nestjs'
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
import { BaseDto } from '@geraldine/nestjs'
import { AutoMap } from '@automapper/classes'

export class TodoDto extends BaseDto {
  @AutoMap()
  title: string
}
```

### Repository

```ts
import { BaseRepository } from '@geraldine/nestjs'
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
import { BaseService } from '@geraldine/nestjs'
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
import { BaseController, GenericRequest, GenericResponse } from '@geraldine/nestjs'
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
import { BaseMapperProfile } from '@geraldine/nestjs'
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

### Using DateTransformInterceptor

Apply globally or per-controller to convert UTC dates to the user's timezone (passed via `X-Timezone` request header):

```ts
import { DateTransformInterceptor } from '@geraldine/nestjs'
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
| `BaseRepository` | Generic CRUD + paged search (insert, read, update, delete, pagedSearch, bulkInsert) |
| `BaseService` | Business logic layer wrapping repository operations |
| `BaseController` | HTTP response helpers (getSuccessJson, getErrorJson, getPagedSearchGridJson, populateAuditFields*) |
| `BaseMapperProfile` | AutoMapper profile base with `createBaseMappings()` helper |
| `FrameworkModule` | NestJS global module — registers AutoMapper. Import once in AppModule. |
| `GenericRequest<T>` | Request wrapper: `new GenericRequest({ data: myDto })` |
| `GenericResponse<T>` | Response wrapper with error/info message collection |
| `GenericPagedSearchResponse<T>` | Paged search response (`dtoCollection`, `totalCount`) |
| `PagedSearchRequest` | Validated paged search request (pageIndex, pageSize, keyword, orderBy, etc.) |
| `BasicResponse` | Base response class with `isError()`, `addErrorMessage()`, `addInfoMessage()` |
| `DateTransformInterceptor` | Converts UTC Date objects to user's timezone string (reads `X-Timezone` header) |
| `FrameworkConstants` | `SortOrder.Ascending` / `SortOrder.Descending` |
| `MessageType` | Enum: `Error` / `Info` / `Warning` |
| `PagedSearchParameter` | Internal paged search model with `fromRequest()` factory |
| `PagedSearchResult<T>` | Internal result type: `{ count, result[] }` |
| `Message` | Internal message model: `{ messageText, type }` |

## License

MIT
