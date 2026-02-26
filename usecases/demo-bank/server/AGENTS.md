# server

Hono API server on Bun. JIT package, no build step.

## Structure

```
src/index.ts    # Hono app entry, middleware
src/client.ts   # typed hc client export (used by client package)
src/routes/     # route modules (loan.ts, payment.ts, signin.ts, etc.)
src/db/         # Drizzle schema + migrations
src/services/   # Vidos integration
src/stores/     # in-memory/persistence
```

## Hono + Types

- Method-chain on `new Hono()` only; `app.get(); app.post()` loses route types → `hc` becomes `unknown`.
- Export `AppType = typeof app` in `client.ts`, and `hcWithType` for client usage.
- Use `zValidator("json", schema)` on every route input (body/query/param).
- Validate outputs with `schema.parse()` before `c.json()`.
- Schemas live in `shared/src/api/*`, import via `"demo-bank-shared/api/xxx"` only.
- Avoid controller classes; prefer `app.route()` + small routers.

## Authorization Awaiting (SSE)

- Authorization waiting is server-driven via SSE + monitor, not per-client polling endpoints.
- When creating a pending auth request, start monitor: `startAuthorizationMonitor(requestId)`.
- Monitor cadence is centralized in `src/services/authorization-monitor.ts` and checks Vidos status, then applies transition logic.
- Request transitions must go through `src/services/pending-request-transition.ts` to keep state changes/idempotency consistent.
- Stream auth request updates via `streamAuthorizationRequest(...)` in `src/services/authorization-stream.ts`.
- SSE transport primitives live in `src/lib/sse.ts` (typed sender, keepalive, cleanup).
- Emit/consume typed internal events via `appEvents` in `src/lib/events.ts` (`authorizationRequestEvent`, `authRequestResolved`).
- Callback waiting also uses SSE (`src/routes/callback.ts`) with shared schema `demo-bank-shared/api/callback-sse`.
- Do not add new `/status/:requestId` polling routes unless explicitly requested.

## Pitfalls

- `hc` path params do not match `/` unless encoded. Use `encodeURIComponent`.
- Bun has a 128MiB request limit; raise `Bun.serve({ maxRequestBodySize })` if needed.
- SSE connections can hit idle timeouts if no data is sent; keepalive interval in `src/lib/sse.ts` must stay below runtime/proxy idle timeout.

## Deployment

Docker-based via Dokploy/Coolify. Bun runs TS directly (no build).

```bash
# From repo root
docker build -f Dockerfile.server -t vidos-server .
```

- Build context: repo root
- Dockerfile: `Dockerfile.server` (in repo root)
- Env vars: `VIDOS_AUTHORIZER_URL` (required), `VIDOS_API_KEY` (optional)

## Database (SQLite + Drizzle)

Schema in `src/db/schema.ts` (DB source of truth). Migrations auto-run on startup.

```bash
# From repo root:
bun run --filter demo-bank-server db:generate   # after schema changes
bun run --filter demo-bank-server db:studio     # GUI browser
```

- `DATABASE_PATH` env var (required) - set in `.env.local` for local dev: `./data/demobank.db`
- Money as INTEGER cents (convert to dollars in API layer)
- JSON columns (`activity`, `metadata`, `result`): use `$type<T>()` + Zod parse on read
- API schemas in `shared/` are separate from DB schema (no shared->server imports)
- `PRAGMA foreign_keys = ON` set on connection for cascades
- Use `.returning()` on UPDATE/INSERT to get values in one query: `db.update(...).returning({ id }).get()`
