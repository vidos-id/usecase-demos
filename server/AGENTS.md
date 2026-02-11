# server

Hono API server running on Bun.

## Commands

```bash
bun run build   # clean + tsc → dist/
bun run dev     # bun --watch + tsc --watch
```

## Structure

```
src/index.ts    # Hono app, routes, middleware
src/client.ts   # typed hc client export (used by client package)
```

## Conventions

- Validate request bodies with `zValidator("json", schema)` from `@hono/zod-validator`.
- Validate responses with `schema.parse()` before returning.
- Import schemas via subpath: `from "shared/api/hello"`, `from "shared/api/other"`.
- Export app from `index.ts`; typed client helper from `client.ts`.
- Client package imports typed client via `"server/client"` (exports map).
- Must rebuild server (`bun run build --filter=server`) for type changes to be available to client.
