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
  api/hello.ts     # request/response schemas for /hello
  api/other.ts     # request/response schemas for /other
  types/           # shared types (future)
```

## Exports

Subpath imports only — no bare `"shared"` import:

```ts
import { helloRequestSchema } from "shared/api/hello";
import { otherQuerySchema } from "shared/api/other";
```

## Conventions

- One module per API endpoint/domain. No barrel re-exports.
- Schemas: `camelCase` suffixed with `Schema` (e.g. `helloRequestSchema`).
- Types: `export type Foo = z.infer<typeof fooSchema>` — always derive from schemas.
- Changes available immediately to consumers — no rebuild needed.
