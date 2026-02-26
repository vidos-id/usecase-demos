# demo-bank

Demo bank lives under `usecases/demo-bank/` with three workspaces:

- `client/` (`demo-bank-client`)
- `server/` (`demo-bank-server`)
- `shared/` (`demo-bank-shared`)

## Imports

- Shared schemas/types: `demo-bank-shared/api/*`, `demo-bank-shared/types/*`, `demo-bank-shared/lib/*`
- Typed server client: `demo-bank-server/client`

## Rules

- Keep cross-workspace types in `shared/src/`.
- Keep server/client contract schemas in shared and infer types from Zod.
- Do not edit generated route files unless specifically requested.
