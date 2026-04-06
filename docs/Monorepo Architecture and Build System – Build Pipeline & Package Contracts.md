# Monorepo Architecture and Build System

## Overview

TaskFlow’s build system is split across workspace-level orchestration and package-level runtime contracts. The workspace is organized so `apps/api` produces a Node-friendly Fastify server bundle, while `apps/web` builds a Next.js client that is type-checked, linted, and exercised with Playwright.

The practical result is a dependency-aware monorepo flow: shared packages such as `@repo/database`, `@repo/validators`, and `@repo/ui` are consumed from the workspace, while each app keeps its own build tools, test tools, and runtime assumptions. The API is optimized for an ESM Node deployment, and the web app is optimized for browser delivery and local developer feedback.

## Architecture Overview

```mermaid
flowchart TB
    Dev[Developer]

    subgraph Orchestration[Workspace Orchestration]
        Pnpm[pnpm workspace commands]
        Turbo[Turborepo task graph]
    end

    subgraph ApiApp[API Package]
        ApiDev[apps api dev script]
        ApiBuild[apps api build script]
        ApiStart[apps api start script]
        ApiLint[apps api lint script]
        ApiTest[apps api test script]
        Tsup[tsup bundle]
        Fastify[Fastify server]
        NodeApi[Node runtime]
    end

    subgraph WebApp[Web Package]
        WebDev[apps web dev script]
        WebBuild[apps web build script]
        WebStart[apps web start script]
        WebLint[apps web lint script]
        WebTypes[apps web check types script]
        Playwright[Playwright e2e]
        NextBuild[Next.js build]
        Browser[Browser runtime]
    end

    subgraph SharedPackages[Shared Workspace Packages]
        DbPkg[@repo/database]
        ValidatorsPkg[@repo/validators]
        UiPkg[@repo/ui]
        AuthPkg[auth]
    end

    subgraph PrismaBoundary[Prisma Client Boundary]
        Schema[packages database prisma schema]
        Client[Generated Prisma client]
    end

    Dev --> Pnpm
    Pnpm --> Turbo

    Turbo --> ApiDev
    Turbo --> ApiBuild
    Turbo --> ApiLint
    Turbo --> ApiTest

    Turbo --> WebDev
    Turbo --> WebBuild
    Turbo --> WebLint
    Turbo --> WebTypes
    Turbo --> Playwright

    ApiBuild --> Tsup
    Tsup --> NodeApi
    NodeApi --> Fastify

    ApiTest --> Client
    WebBuild --> NextBuild
    WebStart --> Browser
    Playwright --> Browser

    DbPkg --> Client
    Schema --> Client

    ApiDev --> DbPkg
    ApiBuild --> DbPkg
    ApiTest --> DbPkg
    WebBuild --> DbPkg
    WebBuild --> ValidatorsPkg
    WebBuild --> UiPkg
    WebBuild --> AuthPkg
```

## Build Pipeline

The workspace is structured around package-local scripts that the root orchestration layer can execute in dependency order. The visible app scripts define the actual commands for building, starting, linting, and validating the codebase.

### Package Script Contract

#### `apps/api/package.json`
*File path: `apps/api/package.json`*

| Script | Description |
|---|---|
| `dev` | Runs `src/index.ts` with `tsx` in watch mode, injects `../../.env`, and enables `tsconfig-paths/register` so workspace aliases resolve during development. |
| `build` | Bundles the API with `tsup`. |
| `start` | Launches the built server from `dist/index.js`. |
| `lint` | Runs `biome lint ./src`. |
| `email` | Starts React Email preview tooling on port `3001` for `src/emails`. |
| `test` | Runs Jest through Node’s ESM VM support. |

#### `apps/web/package.json`
*File path: `apps/web/package.json`*

| Script | Description |
|---|---|
| `dev` | Starts the Next.js dev server on port `3000`. |
| `build` | Runs `next build`. |
| `start` | Runs `next start`. |
| `lint` | Runs `eslint --max-warnings 0`. |
| `check-types` | Runs `next typegen` and `tsc --noEmit`. |

> [!NOTE]
> The root workspace orchestration is dependency-aware through Turborepo, but the app manifests above define the real execution units. That means the root task graph can fan out `build`, `dev`, `lint`, `check-types`, and test work while still delegating the concrete command to each package.

### Dependency-Aware Execution

The build system uses the package boundaries to keep resolution predictable:

- `apps/api` bundles application code with `tsup`, but keeps `@repo/database` external so the Prisma client remains a workspace dependency.
- `apps/web` transpiles workspace packages through Next.js so shared UI, database types, and auth code can be consumed without duplicating build logic.
- Jest resolves `@repo/database` directly to the database package source during tests, which keeps test execution aligned with workspace resolution.
- Playwright is configured to target the browser app directly at `http://localhost:3000`, so the web server must already be running when e2e tests execute.

## API Build and Runtime Contract

### API Bundle Configuration

#### `apps/api/tsup.config.ts`
*File path: `apps/api/tsup.config.ts`*

| Property | Type | Description |
|---|---|---|
| `entry` | `string[]` | Bundles `src/index.ts` as the API entrypoint. |
| `format` | `string[]` | Emits ESM output. |
| `platform` | `string` | Targets Node. |
| `clean` | `boolean` | Cleans the output directory before each build. |
| `noExternal` | `string[]` | Forces `auth` and `@repo/validators` to be bundled locally. |
| `external` | `string[]` | Keeps `@repo/database` external so Prisma stays out of the bundle. |

This config is the key packaging contract for the API: app code is bundled, local shared packages are selectively inlined, and the Prisma-backed database package is intentionally left as a workspace dependency.

### API TypeScript Contract

#### `apps/api/tsconfig.json`
*File path: `apps/api/tsconfig.json`*

| Property | Type | Description |
|---|---|---|
| `jsx` | `string` | Uses `react-jsx`. |
| `baseUrl` | `string` | Resolves local aliases from the package root. |
| `module` | `string` | Uses `ESNext`. |
| `moduleResolution` | `string` | Uses `Bundler`. |
| `target` | `string` | Emits `es2022`. |
| `isolatedModules` | `boolean` | Enables per-file compilation. |
| `outDir` | `string` | Writes build output to `dist`. |
| `rootDir` | `string` | Treats `src` as the source root. |
| `esModuleInterop` | `boolean` | Enables default import interoperability. |
| `strict` | `boolean` | Turns on strict type checking. |
| `skipLibCheck` | `boolean` | Skips library declaration checks. |
| `forceConsistentCasingInFileNames` | `boolean` | Enforces case-consistent imports. |
| `types` | `string[]` | Loads `jest` and `node` types. |
| `paths` | `object` | Defines `@services/*`, `@utils/*`, `@routes/*`, and `@/*` aliases. |
| `include` | `string[]` | Includes `src/**/*` and `__tests__/**/*`. |
| `exclude` | `string[]` | Excludes `node_modules`. |

The path aliases are what make the dev script work with `tsx` and `tsconfig-paths/register`, and they also keep the runtime import style consistent between source, tests, and bundle output.

### Fastify Type Augmentation

#### `apps/api/src/types/fastify.d.ts`
*File path: `apps/api/src/types/fastify.d.ts`*

| Property | Type | Description |
|---|---|---|
| `FastifyRequest.user` | `any` | Adds the authenticated user context to Fastify requests. |
| `FastifyRequest.session` | `any` | Adds the session context to Fastify requests. |

This augmentation supports the API’s auth middleware and route handlers at compile time.

### API Bootstrap and Server Startup

#### `apps/api/src/server.ts`
*File path: `apps/api/src/server.ts`*

| Method | Description |
|---|---|
| `buildServer` | Creates the Fastify instance, configures logging, registers websocket support, adds global rate limiting with `redisConnection`, enables raw body parsing for webhook routes, mounts a websocket test route, wires Hocuspocus collaboration storage through Prisma, registers UploadThing, Stripe webhooks, route modules, and background worker modules. |

#### `apps/api/src/index.ts`
*File path: `apps/api/src/index.ts`*

| Method | Description |
|---|---|
| `start` | Reads `PORT` or `API_PORT` with fallback `4000`, builds the server, and listens on `0.0.0.0`. |

> [!IMPORTANT]
> The API runtime is container-safe by design: `start` binds to `0.0.0.0`, and the process uses `PORT` or `API_PORT` rather than a hardcoded port. The `apps/api/package.json` `start` script expects the build artifact at `dist/index.js`, which is the packaging contract a Docker image would need to preserve.

### API Runtime Inputs and Assumptions

`buildServer` is wired to runtime dependencies that matter for packaging:

- `redisConnection` backs global rate limiting.
- `prisma` is used by Hocuspocus database persistence and route handlers.
- `notificationWorker`, `emailWorker`, `canvasWorker`, and `cleanupWorker` are imported as side effects so the API process also starts BullMQ consumers.
- `fastifyRawBody` is registered globally, but only webhook routes use it.
- `cors` and `helmet` are configured before route registration, so the packaged server assumes middleware initialization happens once at startup.

## Web Build and Packaging Contract

### Web Script Contract

#### `apps/web/package.json`
*File path: `apps/web/package.json`*

| Script | Description |
|---|---|
| `dev` | Starts the Next.js dev server on port `3000`. |
| `build` | Runs `next build`. |
| `start` | Runs `next start`. |
| `lint` | Runs ESLint with zero warning tolerance. |
| `check-types` | Runs `next typegen` and then `tsc --noEmit`. |

The web package is optimized for a standard Next.js release flow: build, type generation, then static type validation.

### Next.js Packaging Assumptions

#### `apps/web/next.config.js`
*File path: `apps/web/next.config.js`*

| Property | Type | Description |
|---|---|---|
| `experimental.serverComponentsExternalPackages` | `string[]` | Keeps `ws` and `@neondatabase/serverless` external in server components. |
| `images.remotePatterns` | `array` | Whitelists remote image hosts for avatars and upload assets. |
| `transpilePackages` | `string[]` | Transpiles `@repo/ui`, `@repo/database`, `auth`, and `@repo/validators`. |

#### `apps/web/next.config.js`
*File path: `apps/web/next.config.js`*

| Method | Description |
|---|---|
| `rewrites` | Proxies `/api/:path*` to `${NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/:path*`. |

This configuration makes the frontend portable across local development and deployment. The rewritten `/api` path specifically targets the auth backend, while `transpilePackages` ensures workspace packages are compatible with the Next.js compiler pipeline.

### Web Styling Build

#### `apps/web/postcss.config.js`
*File path: `apps/web/postcss.config.js`*

| Property | Type | Description |
|---|---|---|
| `plugins` | `object` | Enables `@tailwindcss/postcss` and `autoprefixer`. |

### Web TypeScript Contract

#### `apps/web/tsconfig.json`
*File path: `apps/web/tsconfig.json`*

| Property | Type | Description |
|---|---|---|
| `extends` | `string` | Inherits shared Next.js TypeScript settings from `@repo/typescript-config/nextjs.json`. |
| `baseUrl` | `string` | Resolves package-local paths from the app root. |
| `paths` | `object` | Defines `@/*`, `~/*`, and `@repo/*` aliases. |
| `plugins` | `array` | Enables the Next.js TypeScript plugin. |
| `include` | `string[]` | Includes `next-env.d.ts`, source files, and generated `.next/types` files. |
| `exclude` | `string[]` | Excludes `node_modules`. |

The `@repo/*` path mapping is what allows the web app to consume shared workspace packages directly during development and build.

## Prisma Client Resolution and Workspace Hoisting

The shared database package is the boundary for Prisma client generation and consumption. The API imports Prisma through `@repo/database`, and both the bundle and test configs treat that package as the authoritative workspace client.

#### `apps/api/jest.config.cjs`
*File path: `apps/api/jest.config.cjs`*

| Property | Type | Description |
|---|---|---|
| `preset` | `string` | Uses `ts-jest`. |
| `testEnvironment` | `string` | Runs tests in Node. |
| `testMatch` | `string[]` | Matches `**/*.test.ts`. |
| `clearMocks` | `boolean` | Clears mocks between tests. |
| `moduleNameMapper` | `object` | Resolves workspace aliases and maps `@repo/database` to `../../packages/database/src/client.ts`. |
| `transform` | `object` | Uses `ts-jest` with ESM enabled for `.ts` and `.tsx` files. |

The important packaging assumption is that the generated Prisma client is surfaced through the shared database package, which is built from the Prisma schema at `packages/database/prisma/schema.prisma`. The API build keeps `@repo/database` external, while Jest maps that package straight to source so tests use the same workspace boundary.

### Jest Workspace Mappings

- `^@repo/database$` → `../../packages/database/src/client.ts`
- `^@services/(.*)$` → `src/services/$1`
- `^@utils/(.*)$` → `src/utils/$1`
- `^@routes/(.*)$` → `src/routes/$1`
- `^@/(.*)$` → `src/$1`

These mappings are what make the API test environment mirror workspace resolution instead of bundling assumptions.

## Local Development Workflow

### API Development

The API dev loop is intentionally fast:

1. `node --require tsconfig-paths/register` enables path aliases before execution.
2. `--import tsx --watch` runs TypeScript directly and reloads on changes.
3. `--env-file=../../.env` loads environment variables from the repository root.
4. `src/index.ts` boots the Fastify server through `buildServer()`.

This setup means the API can be developed without a separate compile step, while still matching the production entrypoint shape used by `build` and `start`.

### Web Development

The web client uses the standard Next.js development path:

1. `next dev --port 3000` starts the app.
2. `next build` produces the production bundle.
3. `next start` serves the built app.

The Playwright configuration and the critical-path test both assume the web app is reachable at `http://localhost:3000`.

### Email Preview Development

`apps/api/package.json` includes:

- `email`: `email dev --dir src/emails --port 3001`

This is the local preview path for React Email templates, and it keeps email work inside the API package rather than the frontend app.

## Quality Gates and Test Strategy

### API Test Gate

#### `apps/api/package.json`
*File path: `apps/api/package.json`*

| Script | Description |
|---|---|
| `test` | Runs the Jest suite with Node ESM support. |

The API test runner is aligned with the workspace alias setup in `apps/api/jest.config.cjs`, so it exercises the same source boundaries the runtime build uses.

### Web Type Gate

#### `apps/web/package.json`
*File path: `apps/web/package.json`*

| Script | Description |
|---|---|
| `check-types` | Generates Next.js types and then runs `tsc --noEmit`. |

This gate catches app-level type drift before a production build.

### Playwright Configuration

#### `apps/web/playwright.config.ts`
*File path: `apps/web/playwright.config.ts`*

| Property | Type | Description |
|---|---|---|
| `testDir` | `string` | Uses `./e2e`. |
| `fullyParallel` | `boolean` | Runs tests in parallel. |
| `forbidOnly` | `boolean` | Fails CI when `test.only` is left behind. |
| `retries` | `number` | Retries twice in CI, zero locally. |
| `workers` | `number \| undefined` | Forces one worker in CI. |
| `reporter` | `string` | Uses the HTML reporter. |
| `use.trace` | `string` | Collects trace on first retry. |
| `projects` | `array` | Runs Chromium, Firefox, and WebKit. |

> [!NOTE]
> The `webServer` block is commented out in `apps/web/playwright.config.ts`. The current e2e setup assumes a separate Next.js server is already running before Playwright starts.

### Critical Path Smoke Test

#### `apps/web/e2e/critical-path.spec.ts`
*File path: `apps/web/e2e/critical-path.spec.ts`*

This test is the current highest-level browser gate. It validates the main onboarding path end to end:

1. Open `http://localhost:3000`.
2. Confirm the landing page renders `TaskFlow`.
3. Enter `hello@taskflow.com` into the hero email field.
4. Click `Get Early Access`.
5. Assert the URL matches `sign-up`.
6. Fill `Name`, `Email`, and `Password` in the Better Auth form.
7. Click `Create an account`.
8. Click `Build My Workspace`.
9. Wait for the dashboard route.
10. Assert the `Dashboard` heading becomes visible.

This test documents the current packaging assumption for the frontend: the landing page, auth flow, and onboarding flow must all be available from a running local Next.js server.

### Current Quality Gates

- API bundle gate: `apps/api/package.json` `build`
- API runtime gate: `apps/api/package.json` `start`
- API syntax and lint gate: `apps/api/package.json` `lint`
- API test gate: `apps/api/package.json` `test`
- API preview gate: `apps/api/package.json` `email`
- Web bundle gate: `apps/web/package.json` `build`
- Web runtime gate: `apps/web/package.json` `start`
- Web lint gate: `apps/web/package.json` `lint`
- Web type gate: `apps/web/package.json` `check-types`
- Web e2e gate: `apps/web/e2e/critical-path.spec.ts`

## Container Packaging

The packaging contract for the API is defined by the combination of `tsup`, the Node entrypoint, and the Fastify bootstrap:

- `apps/api/tsup.config.ts` emits a Node ESM bundle from `src/index.ts`.
- `apps/api/package.json` expects the bundle at `dist/index.js`.
- `apps/api/src/index.ts` binds to `0.0.0.0`.
- `apps/api/src/server.ts` initializes middleware, routes, websocket support, and workers before listening.

That makes the API suitable for a container image that copies the built output, sets `PORT` or `API_PORT`, and launches `node dist/index.js`. The web app follows the complementary Next.js packaging path of `next build` followed by `next start`, with its local test setup assuming a separate browser server.

## Key Classes Reference

| Class | Responsibility |
|---|---|
| `package.json` | Defines the API and web package scripts that the workspace build graph executes. |
| `tsup.config.ts` | Defines the API bundle shape, external packages, and Prisma boundary. |
| `server.ts` | Builds and registers the API runtime, middleware, routes, websockets, and workers. |
| `index.ts` | Starts the API process and binds it to the runtime host and port. |
| `jest.config.cjs` | Maps workspace imports for API tests and resolves the Prisma client source boundary. |
| `tsconfig.json` | Defines package-local aliases, compiler behavior, and build output conventions. |
| `next.config.js` | Defines Next.js transpilation, rewrites, image hosts, and server-component externals. |
| `postcss.config.js` | Configures Tailwind and Autoprefixer in the web build pipeline. |
| `playwright.config.ts` | Configures browser test execution, retries, and parallelism. |
| `critical-path.spec.ts` | Verifies the end-to-end signup and onboarding flow against the local web app. |
| `fastify.d.ts` | Extends Fastify request types with auth session fields used by the API. |