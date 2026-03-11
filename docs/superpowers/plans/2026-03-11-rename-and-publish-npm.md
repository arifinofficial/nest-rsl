# Rename and Publish to npm as @fintastic/nest-rsl Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the package from `@geraldine/nestjs` to `@fintastic/nest-rsl` and publish it to the `fintastic` npm organization.

**Architecture:** Single field change in `package.json`, followed by a build + publish. No internal code changes required.

**Tech Stack:** pnpm, tsup, npm registry

---

## Chunk 1: Rename and Publish

**Files:**
- Modify: `package.json` (name field only)

- [ ] **Step 1: Update package name**

In `package.json`, change line 2:
```json
"name": "@fintastic/nest-rsl",
```

- [ ] **Step 2: Verify the change**

Run:
```bash
node -e "console.log(require('./package.json').name)"
```
Expected output: `@fintastic/nest-rsl`

- [ ] **Step 3: Run tests to confirm nothing is broken**

Run:
```bash
pnpm test
```
Expected: all tests pass (package name has no effect on test outcomes)

- [ ] **Step 4: Commit the rename**

```bash
git add package.json
git commit -m "chore: rename package to @fintastic/nest-rsl"
```

- [ ] **Step 5: Login to npm**

Run:
```bash
npm login
```
Follow the prompts. Verify you are logged in as a member of the `fintastic` org:
```bash
npm whoami
npm org ls fintastic
```
Expected: your username appears in the `fintastic` org member list.

- [ ] **Step 6: Build and publish**

Run:
```bash
pnpm publish --access public
```
The `prepublishOnly` hook runs `pnpm build` automatically before publishing.

Expected output includes:
```
npm notice Publishing to https://registry.npmjs.org/ ...
+ @fintastic/nest-rsl@0.1.0
```

- [ ] **Step 7: Verify published package**

Run:
```bash
npm info @fintastic/nest-rsl
```
Expected: package metadata is returned with `name: '@fintastic/nest-rsl'` and `version: '0.1.0'`.
