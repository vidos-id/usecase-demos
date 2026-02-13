# Vidos Use Case Demos

## Commands

| Command               | Description               |
| --------------------- | ------------------------- |
| `bun run dev`         | Run all workspaces        |
| `bun run build`       | Build client (Vite)       |
| `bun run check-types` | Type-check all workspaces |
| `bun run lint`        | Lint with Biome           |
| `bun run format`      | Format with Biome         |

## Deployment

### Server (Docker)

Docker-based deployment. Bun runs TypeScript directly (no build step).

```bash
# Build from repo root
docker build -f Dockerfile.server -t vidos-server .

# Run
docker run -p 3000:3000 \
  -e VIDOS_AUTHORIZER_URL=https://your-authorizer.com \
  -e VIDOS_API_KEY=your-key \
  -e VIDOS_SQLITE_PATH=/data/vidos.sqlite \
  -v /host/vidos-db:/data \
  vidos-server
```

**Dokploy/Coolify config:**

- Build context: repo root
- Dockerfile: `Dockerfile.server`
- Env vars: `VIDOS_AUTHORIZER_URL` (required), `VIDOS_API_KEY` (optional), `VIDOS_SQLITE_PATH` (optional, default `./data/vidos.sqlite`)
- If you mount SQLite to `/data`, ensure the mount is writable and keep WAL sidecars (`.sqlite-wal`, `.sqlite-shm`) in the same folder.
- Back up the mounted DB folder atomically (or stop writes briefly) so main file and WAL sidecars stay consistent.

### Client (GitHub Pages)

Static build deployed via GitHub Actions.

```bash
bun run build:client  # outputs to client/dist/
```

Set `VITE_VIDOS_DEMO_BANK_SERVER_URL` to the deployed server URL at build time.
