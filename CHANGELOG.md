# Changelog

## 0.2.0

### Security

- Fixed an SQL injection in `pagedSearch` in 0.1.0. The `filters` string from the request was placed in the
  query as SQL, and `orderByFieldName` was placed in the `ORDER BY` clause without checking. Any client that
  could call a paged search endpoint could run its own SQL. If you run 0.1.0, upgrade, and until you do,
  do not expose `PagedSearchRequest` to untrusted clients.

### Breaking

- `filters` and `filtersVariable` are rejected when they come from a request.
  `PagedSearchParameter.fromRequest` no longer copies them.
  - With a `ValidationPipe` (whitelisting or not), the pipe answers 400.
  - Without a pipe, `BaseService.pagedSearch` returns an error response and runs no query.
  - Both use this message (also `FrameworkConstants.Messages.FiltersNotAccepted`):
    `filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)`
  - On `PagedSearchRequest` both properties are now typed `never`, so TypeScript code that sets them no
    longer compiles.
  - To keep filtering, set `PagedSearchParameter.filters` and `filtersVariable` in the service
    (see [Migrating from 0.1](#migrating-from-01)).
- `orderByFieldName` must be the property name of a top-level column of the entity (case-sensitive).
  Any other value is rejected with `Invalid orderByFieldName: <name>`. `BaseService.pagedSearch` returns it
  as an error message and runs no query. Calling `BaseRepository.pagedSearch` directly throws an `Error`
  with the same message.

### Added

- `softDeleteColumn` on `BaseRepository`: opt-in soft-delete with a boolean column. See the README.
- `hardDelete(id)` on `BaseRepository` and `hardDelete(request)` on `BaseService`. Without
  `softDeleteColumn` it is the same as `delete`.
- `isSortableField(name)` on `BaseRepository`.
- `FrameworkConstants.Messages.FiltersNotAccepted`.
- The type constraint is relaxed to `BaseRepository<Entity extends { id: IdType }, Dto extends { id: IdType }, IdType = number>`
  (the same on `BaseService`). Entities and DTOs no longer need to extend `BaseEntity` / `BaseDto`.
- NestJS 12 is tested, together with `@automapper/*` 9 and TypeORM 1.x. NestJS 11, `@automapper/*` 8 and
  TypeORM 0.3 on CommonJS are still tested. Peer ranges are unchanged.

### Migrating from 0.1

1. Move every client-supplied `filters` / `filtersVariable` into the service.

   Before (0.1.0): the client sent the SQL condition.

   ```json
   {
     "pageIndex": 0,
     "pageSize": 20,
     "filters": "entity.status = :status",
     "filtersVariable": { "status": "open" }
   }
   ```

   After (0.2.0): the client sends only the values you allow, and the service builds the filter.

   ```json
   { "pageIndex": 0, "pageSize": 20 }
   ```

   ```ts
   @Injectable()
   export class TodoService extends BaseService<TodoEntity, TodoDto> {
     constructor(repo: TodoRepository) {
       super(repo)
     }

     protected override getPagedSearchParameter(request: PagedSearchRequest): PagedSearchParameter {
       const parameter = super.getPagedSearchParameter(request)
       parameter.filters = 'entity.status = :status'
       parameter.filtersVariable = { status: 'open' }
       return parameter
     }
   }
   ```

   Pass every user-controlled value through `filtersVariable`. Do not use the names `keyword` or
   `__rslSoftDeleteLive` there; the base query binds them.
2. Make sure clients send an `orderByFieldName` that is a top-level entity property name, or none.
3. Optional: set `softDeleteColumn` in a repository to turn `delete` into a soft-delete, and call
   `hardDelete` when you need to remove the row.
4. Optional: drop the `BaseEntity` / `BaseDto` requirement for entities that have no audit fields. Use
   `createMap` instead of `createBaseMappings` for them.
5. On NestJS 12 with pnpm, add the `peerDependencyRules` block from the README.
