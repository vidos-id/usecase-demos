# shared

Zod schemas + inferred TS types. JIT package — exports `.ts` source directly, no build step.

## Commands

```bash
bun run check-types   # tsc --noEmit
```

## Structure

No barrel files. Separate modules under `api/` and `types/`:

```
src/
  api/             # per-endpoint schemas (hello.ts, loan.ts, payment.ts, signin.ts, signup.ts, etc.)
  types/           # shared types (auth.ts, loan.ts, vidos-errors.ts)
```

## Exports

Subpath imports only — no bare `"demo-bank-shared"` import:

```ts
import { helloRequestSchema } from "demo-bank-shared/api/hello";
import { loanRequestSchema } from "demo-bank-shared/api/loan";
```

## Conventions

- One module per API endpoint/domain. No barrel re-exports.
- Schemas: `camelCase` suffixed with `Schema` (e.g. `helloRequestSchema`).
- Types: `export type Foo = z.infer<typeof fooSchema>` — always derive from schemas.
- Changes available immediately to consumers — no rebuild needed.

## API Design Rules

- Define request/response schemas together per endpoint in `shared/src/api/*`.
- Prefer explicit response schemas, even for simple payloads.
