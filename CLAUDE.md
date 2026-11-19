# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@fintastic/nest-rsl` is a standalone TypeScript library — not an application. It provides generic base classes for NestJS modules: `BaseEntity`, `BaseDto`, `BaseRepository`, `BaseService`, `BaseController`, `BaseMapperProfile`, plus request/response wrappers and utilities.

Built with **tsup** (ESM + CJS dual output), tested with **Vitest**.

## Commands

```bash
pnpm build          # Compile ESM + CJS to dist/
pnpm dev            # Watch mode
pnpm test           # Vitest (NestJS 12 stack), then test:compat
pnpm test:compat    # Build, pack a tarball, and run the CJS fixture in compat/ (NestJS 11, @automapper 8, TypeORM 0.3)
pnpm vitest run basic-response                  # Single Vitest file
pnpm vitest run -t "should return"              # Single Vitest test by name
```

## Project Structure

```
src/
  base/             # Core base classes (entity, dto, repository, service, controller, mapper profile)
  dto/
    request/        # GenericRequest, PagedSearchRequest
    response/       # BasicResponse, GenericResponse, GenericPagedSearchResponse
  enums/            # MessageType enum
  models/           # Internal models (Message, PagedSearchParameter, PagedSearchResult)
  constants/        # FrameworkConstants (SortOrder)
  interceptors/     # DateTransformInterceptor
  framework.module.ts   # NestJS global module (registers AutoMapper)
  index.ts          # Single public entry point — re-exports everything
tests/              # Vitest specs (*.spec.ts)
```

All public exports go through `src/index.ts`. When adding a new file, export it from the appropriate barrel `index.ts` and ensure it reaches `src/index.ts`.

## Key Patterns

**BaseRepository** generic signature: `BaseRepository<Entity extends { id: IdType }, Dto extends { id: IdType }, IdType = number>`. Entities and DTOs need only an `id`; for types without audit fields use `createMap` directly, because `createBaseMappings` maps the audit members to `undefined`. Override `getKeywordSearchCondition()` to enable keyword search in `pagedSearch()`. Default returns `'1=1'` (no-op).

**Soft-delete**: a repository opts in with `protected override readonly softDeleteColumn = 'prop'` (a boolean entity property, `false` is live). `read`, `update`, `delete` and `pagedSearch` then see only live rows, and `delete` sets the column to `true`. `hardDelete` removes the row whether live or not; without `softDeleteColumn` it equals `delete`. `pagedSearch` builds `(keyword) AND (filters) AND (soft-delete)`, the keyword and filter conditions each wrapped in `Brackets`. Without `softDeleteColumn`, behaviour must stay identical to 0.1.0.

**Server-side filters**: `filters` / `filtersVariable` are never accepted from a request (`PagedSearchRequest` types them `never` and rejects them; `BaseService.pagedSearchInternal` rejects them without a pipe; message in `FrameworkConstants.Messages.FiltersNotAccepted`). A service sets them by overriding `getPagedSearchParameter`. `filtersVariable` must not use the names `keyword` or `__rslSoftDeleteLive`, which the base query binds.

**Sortable fields**: `orderByFieldName` must be a top-level entity column property name, checked by `isSortableField(name)` against TypeORM metadata. `BaseService` returns `Invalid orderByFieldName: <name>` without querying; `BaseRepository.pagedSearch` throws.

**BaseController** response shape:
- Success: `{ isSuccess: true, messageInfoTextArray, value }`
- Error: throws `HttpException` with `{ isSuccess: false, messageErrorTextArray }`
- Paged: `{ data, total, pageIndex, pageSize, totalPages }`

**BaseService** wraps repository and returns `GenericResponse<T>`. Always check `response.isError()` before using `response.data`.

**AutoMapper**: Every Entity ↔ DTO mapping needs a profile extending `BaseMapperProfile` and calling `createBaseMappings(mapper, EntityType, DtoType)`. Both Entity and DTO fields need `@AutoMap()` decorator.

**DateTransformInterceptor**: Reads `X-Timezone` request header and converts UTC `Date` objects in responses to that timezone string.

## tsup Config

Entry: `src/index.ts` → outputs `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types). `prepublishOnly` runs `pnpm build` automatically.

## Tests

Tests live in `tests/` (not colocated; `tests/support/todo.fixture.ts` has a real in-memory `sql.js` TypeORM `DataSource` harness, so generated SQL is exercised). Vitest (`vitest.config.mts`) runs with globals (`describe`, `it`, `expect`, `vi`); `tsconfig.json` has `experimentalDecorators` and `emitDecoratorMetadata` enabled (required for NestJS decorators). NestJS 12 and `@automapper/nestjs` 9 are ESM only, so the dev stack cannot use Jest. `peerDependencyRules` for the automapper peer mismatch live in `pnpm-workspace.yaml`.

`pnpm test` runs Vitest and then `pnpm test:compat`. `test:compat` builds, packs `compat/nest-rsl.tgz`, installs the old stack fixture in `compat/` (CommonJS, NestJS 11, `@automapper` 8, TypeORM 0.3) and runs `compat/run.cjs` against the packed tarball, so both supported stacks are checked. `package.json` `files` ships `dist` and `CHANGELOG.md`.
