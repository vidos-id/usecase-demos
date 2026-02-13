# AGENTS.md

## Project

Bun + Turbo monorepo: `client/` (React/Vite), `server/` (Hono), `shared/` (Zod schemas/types).

JIT packages — `shared` and `server` export `.ts` source directly. No build step.

## Commands

```bash
bun run build        # vite build (client only)
bun run check-types  # tsc --noEmit across workspaces
bun run lint         # biome lint
bun run format       # biome format --write
```

**DO NOT** run `bun run dev` unless explicitly told.

## Directory Structure

```
client/src/
  routes/           # TanStack Router (file-based)
  components/       # ui/ (shadcn), auth/, dialogs/, guide/, landing/, layout/
  lib/              # api-client.ts, auth.ts, utils.ts
server/src/
  index.ts          # Hono app entry (method-chained routes)
  client.ts         # typed Hono client export
  routes/           # endpoint handlers
  db/               # Drizzle schema/migrations
  services/         # Vidos integration
  stores/           # in-memory/persistence
shared/src/
  api/              # Zod schemas per endpoint (no barrel files)
  types/            # shared types
```

## Imports

Cross-workspace: `import { x } from "shared/api/hello"`, `import { y } from "server/client"`.

## Code Style

- Biome: tabs, double quotes. Run `bun run format` before commit.
- TypeScript strict mode. Zod v4.
- PascalCase components/types, camelCase vars/functions.
- Zod schemas suffixed `Schema`.
- No barrel files in shared.
- Do NOT edit `client/src/routeTree.gen.ts` (auto-generated).

## Type Safety

```
shared/src/api/*.ts    → Zod schemas (source of truth)
       ↓
server/src/index.ts    → METHOD-CHAINED routes for type inference
       ↓
server/src/client.ts   → AppType = typeof app; exports hcWithType
       ↓
client/                → fully typed client.endpoint.$method()
```

**Critical**: Hono app MUST use method chaining (`new Hono().get(...).post(...)`) — separate statements break type inference.
