# shared

Zod schemas + inferred TS types consumed by both `client` and `server`.

## Commands

```bash
bun run build   # clean + tsc → dist/
bun run dev     # tsc --watch
```

## Structure

No barrel files. Separate modules under `api/` and `types/`:

```
src/
  api/hello.ts     # request/response schemas for /hello
  api/other.ts     # request/response schemas for /other
  types/           # shared types (future)
  index.ts         # empty — not used as barrel
```

## Exports

Package uses `exports` map — no bare `"shared"` import. Use subpaths:

```ts
import { helloRequestSchema } from "shared/api/hello";
import { otherQuerySchema } from "shared/api/other";
```

## Conventions

- Schemas: `camelCase` suffixed with `Schema` (e.g. `helloRequestSchema`).
- Types: `export type Foo = z.infer<typeof fooSchema>` — always derive from schemas.
- One module per API endpoint/domain. No barrel re-exports.
- After changes, run `bun run build --filter=shared` — consumers import from compiled `dist/`.
