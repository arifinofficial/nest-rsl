# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@fintastic/nest-rsl` is a standalone TypeScript library — not an application. It provides generic base classes for NestJS modules: `BaseEntity`, `BaseDto`, `BaseRepository`, `BaseService`, `BaseController`, `BaseMapperProfile`, plus request/response wrappers and utilities.

Built with **tsup** (ESM + CJS dual output), tested with **Vitest**.

## Commands

```bash
pnpm build          # Compile ESM + CJS to dist/
pnpm dev            # Watch mode
pnpm test           # Run all tests
pnpm test basic-response                        # Single test file
pnpm test -t "should return"                    # Single test by name
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

**BaseRepository** generic signature: `BaseRepository<Entity, Dto, IdType = number>`. Override `getKeywordSearchCondition()` to enable keyword search in `pagedSearch()`. Default returns `'1=1'` (no-op).

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

Tests live in `tests/` (not colocated). Vitest runs with globals (`describe`, `it`, `expect`, `vi`); `tsconfig.json` has `experimentalDecorators` and `emitDecoratorMetadata` enabled (required for NestJS decorators). NestJS 12 and `@automapper/nestjs` 9 are ESM only, so the dev stack cannot use Jest. `peerDependencyRules` for the automapper peer mismatch live in `pnpm-workspace.yaml`.
