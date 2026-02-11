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
server/   → Hono API
shared/   → Shared types & Zod schemas
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Run all workspaces |
| `bun run build` | Build all workspaces |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format with Biome |
| `bun run type-check` | Type-check all |
