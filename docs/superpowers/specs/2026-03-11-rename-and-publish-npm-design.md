# Design: Rename and Publish to npm as @fintastic/nest-rsl

## Summary

Rename the package scope from `@geraldine/nestjs` to `@fintastic/nest-rsl` and publish it to the `fintastic` npm organization for the first time. No existing consumers.

## Change Required

**File:** `package.json`

Update the `name` field:
```json
"name": "@fintastic/nest-rsl"
```

No other files need to change. All class names, internals, and behavior remain identical.

## Publish Steps

1. Login to npm (one-time): `npm login`
2. Build and publish: `pnpm publish --access public`
   - `prepublishOnly` hook automatically runs `pnpm build` before publishing
   - `--access public` is required for scoped packages to avoid defaulting to private

## Consumer Usage After Publish

Install:
```bash
pnpm add @fintastic/nest-rsl
```

Import:
```ts
import { BaseEntity, BaseRepository, BaseService, BaseController, BaseDto, BaseMapperProfile, FrameworkModule, GenericRequest, GenericResponse } from '@fintastic/nest-rsl'
```

## Out of Scope

- No consumer migrations (no existing consumers)
- No internal code changes
- No CI/CD setup
