# AGENTS.md

## Project

Bun + Turbo monorepo for multiple Vidos use case examples under `usecases/`.

Current primary use case:

- `usecases/demo-bank/client` (`demo-bank-client`) - React/Vite
- `usecases/demo-bank/server` (`demo-bank-server`) - Hono/Bun
- `usecases/demo-bank/shared` (`demo-bank-shared`) - shared schemas/types

JIT packages: server + shared export `.ts` source directly; no build step required.

## Commands

```bash
bun run build        # workspace build tasks
bun run check-types  # type-check all workspaces
bun run lint         # biome lint
bun run format       # biome format --write
```

Do not run long-lived dev servers unless explicitly requested.

## Workspace Rules

- Keep use case-specific code under `usecases/<name>/`.
- Prefer workspace package imports over deep relative imports.
- For demo bank, use:
  - `demo-bank-shared/api/*`
  - `demo-bank-shared/types/*`
  - `demo-bank-server/client`

## Style

- Biome formatting: tabs + double quotes.
- TypeScript strict mode.
- Keep shared schemas as source of truth; derive types from Zod.
- Do not edit generated files unless explicitly asked.
