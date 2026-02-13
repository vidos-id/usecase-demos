## Context

DemoBank server uses in-memory Maps for users, sessions, and pending auth requests. Data loss on restart is unacceptable for a deployed demo. This is a greenfield project - all existing API types, interfaces, and internal structures are free to change without legacy concerns.

**Current state:**
- `server/src/stores/` - Three Map-based stores (users, sessions, pending-auth-requests)
- `server/src/types/` - TypeScript interfaces for User, Session, PendingAuthRequest
- `shared/src/api/` - Manually maintained Zod schemas for API contracts
- Single-instance Docker deployment on VPS

**Constraints:**
- Bun runtime with native `bun:sqlite` driver
- No external database infrastructure (SQLite file-based)
- Single instance deployment (no concurrent migration concerns)

## Goals / Non-Goals

**Goals:**
- Persist all data across server restarts
- Single source of truth for types (Drizzle schema -> Zod -> TypeScript)
- Auto-run migrations on server startup
- Configurable database path for Docker volume mounting
- Maintain existing API contracts (external behavior unchanged)

**Non-Goals:**
- Multi-instance/distributed deployment support
- Database replication or backups
- WAL mode optimization
- Data migration from existing in-memory state (fresh start acceptable)
- Preserving internal type structure (greenfield - can redesign)

## Decisions

### D1: Drizzle ORM with bun:sqlite driver

**Choice:** Use Drizzle ORM with native `bun:sqlite`

**Rationale:**
- Type-safe queries with full TypeScript inference
- First-class Zod integration via `drizzle-orm/zod`
- Bun's native SQLite driver is 3-6x faster than alternatives
- Zero external dependencies for SQLite

**Alternatives considered:**
- Raw `bun:sqlite` - More boilerplate, no schema management
- Better-sqlite3 - External dependency, slower than native
- Prisma - Heavier, requires build step, worse Zod integration

### D2: Schema location in server/src/db/

**Choice:** All database code in `server/src/db/`

```
server/src/db/
  schema.ts       # Drizzle table definitions (source of truth)
  index.ts        # Database connection + migrate on startup
  migrations/     # Generated SQL migrations
```

**Rationale:**
- Database is server-side concern
- API types exported to shared via drizzle-zod generation
- Clear separation: DB layer internal, API schemas external

**Alternatives considered:**
- `shared/src/db/` - Leaks server implementation to client package

### D3: Drizzle schema in server, API schemas separate in shared

**Choice:** Drizzle tables defined in `server/src/db/schema.ts`. API Zod schemas stay in `shared/src/api/` and are maintained separately (not imported from server).

```typescript
// server/src/db/schema.ts - DB layer, server-only
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  balanceCents: integer("balance_cents").notNull().default(0),
  // ... internal columns
});

// shared/src/api/users-me.ts - API contract, independent of server
export const userProfileResponseSchema = z.object({
  id: z.string(),
  familyName: z.string(),
  balance: z.number(), // converted from cents in server
  // ... only exposed fields, different shape than DB
});
```

**Rationale:**
- Shared must NOT import from server (breaks workspace rules, client could bundle server code)
- API schema ≠ DB schema: API may omit internal columns, rename fields, transform values
- Server maps DB rows to API responses explicitly (clear transformation layer)
- `createSelectSchema` useful internally for DB validation, but not exported to shared

**Alternatives considered:**
- Shared imports from server - Breaks dependency direction, bundling issues
- Move Drizzle schema to shared - Leaks DB implementation to client
- Auto-generate API from DB schema - Loses flexibility to shape API independently

### D4: Drizzle-generated migrations + startup apply

**Choice:** Generate migrations via `drizzle-kit generate`, apply on server startup

```bash
# Development: generate migration after schema changes
bunx drizzle-kit generate
```

```typescript
// server/src/db/index.ts - applies migrations on startup
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

// Use import.meta.dir for reliable path resolution regardless of cwd
const migrationsFolder = path.join(import.meta.dir, "migrations");

const db = drizzle(sqlite);
migrate(db, { migrationsFolder });
```

**Rationale:**
- `drizzle-kit generate` diffs schema.ts against DB, produces SQL migrations
- Migrations are version-controlled, reviewable, deterministic
- Single instance deployment eliminates race conditions on apply
- Prefer generated migrations; hand-edit only when necessary for complex changes
- Use `import.meta.dir` for path resolution (works regardless of process cwd)

**Alternatives considered:**
- Manual SQL migrations - Error-prone, drift risk
- `drizzle-kit push` (no migrations) - No version control, risky for production
- Relative paths from cwd - Breaks when run from different directories

### D5: Normalized schema with JSON for complex fields

**Choice:** Normalize tables, use JSON columns for flexible fields

**Tables:**
- `users` - Core user data, `activity` as JSON array
- `sessions` - Session data with foreign key to users
- `pending_auth_requests` - Auth flow state, `metadata` and `result` as JSON

**Rationale:**
- Activity items are append-only, queried with user (JSON array is fine)
- Metadata/result are opaque blobs, rarely queried
- Avoids over-normalization for a simple demo app

**Alternatives considered:**
- Separate `activity_items` table - Overkill, complicates queries
- Full normalization - Unnecessary complexity for demo scope

### D6: Environment variable for database path

**Choice:** `DATABASE_PATH` env var, default `./data/demobank.db`

```typescript
const envSchema = z.object({
  // ... existing
  DATABASE_PATH: z.string().default("./data/demobank.db"),
});
```

**Rationale:**
- Docker volume mount at `/app/data`
- Consistent with twelve-factor app configuration
- Sensible default for local development

## Schema Design

```sql
-- Enable foreign keys (MUST be set per connection)
PRAGMA foreign_keys = ON;

-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  document_number TEXT,
  family_name TEXT NOT NULL,
  given_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  nationality TEXT NOT NULL,
  email TEXT,
  address TEXT,
  portrait TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,        -- cents, not float
  pending_loans_total_cents INTEGER NOT NULL DEFAULT 0,  -- cents, not float
  activity TEXT NOT NULL DEFAULT '[]',  -- JSON array, parse with Zod on read
  created_at TEXT NOT NULL
);

-- sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,  -- 'direct_post' | 'dc_api'
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- pending_auth_requests table
CREATE TABLE pending_auth_requests (
  id TEXT PRIMARY KEY,
  vidos_authorization_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,  -- 'signup' | 'signin' | 'payment' | 'loan'
  mode TEXT NOT NULL,  -- 'direct_post' | 'dc_api'
  status TEXT NOT NULL DEFAULT 'pending',
  response_url TEXT,
  metadata TEXT,  -- JSON, parse with Zod on read
  created_at TEXT NOT NULL,
  completed_at TEXT,
  result TEXT  -- JSON, parse with Zod on read
);

CREATE INDEX idx_pending_auth_vidos_id ON pending_auth_requests(vidos_authorization_id);
```

**Notes:**
- `PRAGMA foreign_keys = ON` must be set on each connection for cascades to work
- Money stored as INTEGER cents (avoids floating point precision issues)
- JSON columns use `$type<T>()` in Drizzle + Zod parse on read for type safety

## Risks / Trade-offs

**[Risk] JSON columns lose queryability** → Acceptable for activity/metadata; these are retrieved with parent record, not queried independently.

**[Risk] SQLite file corruption** → Mitigated by default journal mode; data is demo-only, not critical.

**[Risk] Migration failures on startup** → Server fails fast with clear error; operator can check logs and fix.

**[Risk] Foreign keys not enforced** → SQLite requires `PRAGMA foreign_keys = ON` per connection. Set in db/index.ts on connection init.

**[Risk] Activity update race condition** → Read-modify-write on JSON array not atomic. Mitigate by wrapping activity updates in a transaction. Acceptable for demo (low concurrency).

**[Risk] Expired rows accumulate** → TTL checks are in-code, expired rows stay in DB. Acceptable for demo; add periodic cleanup if DB grows large.

**[Trade-off] Startup latency** → Migration check adds ~50-100ms to cold start; acceptable for demo.

**[Trade-off] No type safety for JSON columns** → Use Zod parsing when reading; Drizzle `.$type<T>()` for hints.

## Migration Plan

1. **Add dependencies:** `drizzle-orm`, `drizzle-kit` (dev)
2. **Create drizzle.config.ts:** Configure schema path, migrations folder, dialect
3. **Create schema:** `server/src/db/schema.ts` with all tables
4. **Generate initial migration:** `bunx drizzle-kit generate`
5. **Update env:** Add `DATABASE_PATH` to env schema
6. **Create db module:** `server/src/db/index.ts` with connection + auto-migrate
7. **Refactor stores:** Replace Map operations with Drizzle queries
8. **Update shared schemas:** Generate from Drizzle, re-export for API
9. **Update Dockerfile:** Create `/app/data` directory
10. **Update server AGENTS.md:** Add concise DB setup section
11. **Document deployment:** Volume mount instructions

**Rollback:** Revert to previous commit; in-memory stores still functional.

## AGENTS.md Addition

Add to `server/AGENTS.md`:

```markdown
## Database (SQLite + Drizzle)

Schema in `src/db/schema.ts` (DB source of truth). Migrations auto-run on startup.

```bash
bunx drizzle-kit generate  # after schema changes
bunx drizzle-kit studio    # GUI browser
```

- `DATABASE_PATH` env var (default: `./data/demobank.db`)
- Money as INTEGER cents (convert to dollars in API layer)
- JSON columns (`activity`, `metadata`, `result`): use `$type<T>()` + Zod parse on read
- API schemas in `shared/` are separate from DB schema (no shared->server imports)
- `PRAGMA foreign_keys = ON` set on connection for cascades
```

## Open Questions

None - all decisions resolved during proposal phase.
