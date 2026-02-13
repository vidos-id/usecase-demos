## Why

Server data (users, sessions, pending auth requests) is currently stored in-memory using JavaScript Maps. This causes complete data loss on server restart, making the demo unsuitable for persistent deployments. SQLite provides a lightweight, file-based persistence layer that survives restarts without requiring external database infrastructure.

## What Changes

- **BREAKING**: Replace in-memory Map stores with SQLite database using Drizzle ORM
- Add Drizzle schema definitions in `server/src/db/` for users, sessions, and pending_auth_requests tables
- Use `drizzle-orm/zod` to generate Zod schemas from Drizzle table definitions (Drizzle becomes source of truth)
- Auto-run migrations on server startup (single instance deployment)
- Configure database file path via environment variable for Docker volume mounting
- Add `drizzle-kit` for migration generation during development

## Capabilities

### New Capabilities

- `sqlite-database`: SQLite database setup with Drizzle ORM, including connection handling, schema definitions, and migrations

### Modified Capabilities

- `data-models`: **BREAKING** - Convert from in-memory Maps to SQLite tables. Store operations become async database queries. Zod schemas generated from Drizzle table definitions instead of manually maintained.

## Impact

**Server:**
- `server/src/db/` - New directory for Drizzle schema, connection, and migrations
- `server/src/stores/` - Refactor to use Drizzle queries instead of Maps
- All store operations become async (already were, but now actually hit DB)

**Shared:**
- `shared/src/api/` - Zod schemas will be generated from Drizzle schemas and re-exported. API contracts unchanged, but source of truth moves to Drizzle.

**Dependencies:**
- `drizzle-orm` - ORM for type-safe database access
- `drizzle-kit` - Dev dependency for migration generation
- `bun:sqlite` - Native Bun SQLite driver (built-in, no npm package needed)

**Deployment:**
- New env var: `DATABASE_PATH` - Path to SQLite database file (default: `./data/demobank.db`)
- Docker: Mount volume at database path for persistence
- Migrations run automatically on startup

**Docker Configuration:**
- Update `Dockerfile.server` to create data directory
- Document volume mount: `-v /host/path:/app/data`
