# vidos-usecase-demos

Full-stack TypeScript monorepo: React client + Hono server + shared types.

## Setup

```sh
bun install
bun run dev
```

Client: http://localhost:5173 | Server: http://localhost:3000

## Structure

```
client/   → React + Vite + TanStack Router
server/   → Hono API (runs TS directly via Bun)
shared/   → Zod schemas & shared types (JIT — no build step)

## Type Safety

- Zod schemas live in `shared/src/api/*` and are the source of truth.
- Server validates inputs with `zValidator()` and outputs with `schema.parse()`.
- Client uses `hcWithType` from `server/src/client.ts` for typed RPC calls.
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Run all workspaces |
| `bun run build` | Build client (Vite) |
| `bun run check-types` | Type-check all workspaces |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format with Biome |
