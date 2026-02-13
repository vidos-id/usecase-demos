# Server SQLite + Drizzle replatform plan (greenfield API & types)

## Goal

Replatform the server to a SQLite-first architecture using Bun SQLite + Drizzle with **no dependency on legacy in-memory store interfaces, legacy server types, or DAO compatibility layers**.  
This is a greenfield redesign constrained only by client integration.

## Scope and boundaries

- **In scope**
  - New DB-first domain model and API contracts optimized for Drizzle/SQLite.
  - New typed repository/services architecture (no legacy store wrappers).
  - New Zod schemas derived from Drizzle tables where practical.
  - Client updates to consume new API contracts.
  - Deployment docs for mounted SQLite path selection.
- **Out of scope**
  - Preserving old route signatures, payload shapes, or type names.
  - Temporary compatibility adapters unless needed for a short migration branch.

## Key design decisions

1. **DB is source of truth**
   - Drizzle schema defines canonical data model.
   - API types and Zod validators are generated/derived from DB model, not legacy interfaces.
2. **No legacy stores / no DAO façade**
   - Remove `server/src/stores/*` pattern.
   - Introduce focused modules:
     - `repositories/*` for SQL persistence
     - `services/*` for business logic
     - `routes/*` as thin transport layer.
3. **Connector/runtime**
   - Use `drizzle-orm/bun-sqlite` with explicit `bun:sqlite` `Database` client.
   - DB init enables WAL and strict mode.
4. **Type strategy**
   - Use Drizzle `$inferSelect`/`$inferInsert` as DB row/input types.
   - Use `drizzle-orm/zod` (`createSelectSchema`, `createInsertSchema`, `createUpdateSchema`) for validation.
   - Define transport DTO schemas separately only where endpoint shape differs from table shape.
5. **Timestamps and JSON**
   - Store timestamps as ISO text in SQLite for predictable serialization.
   - Store flexible metadata as JSON text with explicit Zod decoding/validation at boundaries.
6. **API redesign principle**
   - Prefer consistent resource-oriented endpoints and explicit status enums.
   - Align response shapes with query needs to reduce mapping code.

## Proposed folder structure (lean, small files)

```txt
server/
  drizzle.config.ts
  drizzle/
    0000_*.sql
    meta/...
  src/
    db/
      client.ts
      schema/
        users.ts
        sessions.ts
        auth-requests.ts
        activities.ts
        index.ts
      zod/
        users.ts
        sessions.ts
        auth-requests.ts
        activities.ts
    repositories/
      users-repository.ts
      sessions-repository.ts
      auth-requests-repository.ts
      activities-repository.ts
    services/
      auth-service.ts
      payment-service.ts
      loan-service.ts
      profile-service.ts
    routes/
      auth.ts
      payment.ts
      loan.ts
      profile.ts
      admin.ts
    api/
      schemas/
        auth.ts
        payment.ts
        loan.ts
        profile.ts
```

## SQLite schema (target model)

### `users`
- `id` TEXT PK
- `identifier` TEXT NOT NULL UNIQUE
- `document_number` TEXT NULL
- `family_name` TEXT NOT NULL
- `given_name` TEXT NOT NULL
- `birth_date` TEXT NULL
- `nationality` TEXT NULL
- `email` TEXT NULL
- `address` TEXT NULL
- `portrait` TEXT NULL
- `created_at` TEXT NOT NULL

### `sessions`
- `id` TEXT PK
- `user_id` TEXT NOT NULL FK
- `mode` TEXT NOT NULL (`direct_post` | `dc_api`)
- `status` TEXT NOT NULL (`active` | `expired` | `revoked`)
- `created_at` TEXT NOT NULL
- `expires_at` TEXT NOT NULL
- indexes: `(user_id)`, `(expires_at)`, `(status)`

### `auth_requests`
- `id` TEXT PK
- `external_authorization_id` TEXT NOT NULL UNIQUE
- `kind` TEXT NOT NULL (`signup` | `signin` | `payment` | `loan`)
- `mode` TEXT NOT NULL
- `status` TEXT NOT NULL (`pending` | `authorized` | `failed` | `expired`)
- `request_payload` TEXT NULL (JSON)
- `verified_claims` TEXT NULL (JSON)
- `error_message` TEXT NULL
- `created_at` TEXT NOT NULL
- `completed_at` TEXT NULL
- indexes: `(external_authorization_id)`, `(status)`, `(kind, status)`

### `activities`
- `id` TEXT PK
- `user_id` TEXT NOT NULL FK
- `kind` TEXT NOT NULL (`payment` | `loan`)
- `title` TEXT NOT NULL
- `amount` REAL NOT NULL
- `metadata` TEXT NULL (JSON)
- `created_at` TEXT NOT NULL
- index: `(user_id, created_at DESC)`

## API redesign (client-facing)

- Consolidate auth flow endpoints under `/api/auth/*`.
- Replace legacy request/status/complete variants with consistent lifecycle payloads:
  - create challenge/request
  - poll/get request status
  - complete request
- Return normalized response envelopes with explicit `status` enums and typed payloads.
- Expose user profile and activity through dedicated endpoints shaped directly for UI needs.

## Delegable implementation work plan

- [ ] **Task 1 — Establish foundation**
  - Add `drizzle-orm`, `drizzle-kit`.
  - Add `VIDOS_SQLITE_PATH` env in `env.ts`.
  - Add `drizzle.config.ts` and DB scripts (`db:generate`, `db:migrate`, `db:push`).

- [ ] **Task 2 — Implement DB client and schema modules**
  - Create `db/client.ts` with Bun `Database(..., { create: true, strict: true })`.
  - Enable WAL in init.
  - Implement split schema files and central `schema/index.ts`.

- [ ] **Task 3 — Generate migrations**
  - Generate initial migration.
  - Validate SQL for indexes/constraints/enums/checks.
  - Commit migration and meta snapshots.

- [ ] **Task 4 — Build repository layer**
  - Implement repository modules directly against Drizzle queries.
  - No legacy adapters, no old type reuse.
  - Unit-test critical query methods (create/read/update/status transitions).

- [ ] **Task 5 — Build service layer**
  - Move business workflows to services:
    - signup/signin
    - payment authorization and posting activity
    - loan authorization and posting activity
  - Keep TTL and authorization semantics, but with new types.

- [ ] **Task 6 — Redesign route contracts**
  - Define new route schemas in `server/src/api/schemas/*`.
  - Wire routes to services.
  - Remove old route payload contracts and deprecated endpoints (or keep temporary aliases only if needed to stage client migration).

- [ ] **Task 7 — Update client integration**
  - Update client API calls and typed route usage to new endpoints/schemas.
  - Regenerate any inferred RPC types if needed.
  - Validate UI flows end-to-end against new contract.

- [ ] **Task 8 — Remove legacy code**
  - Delete `server/src/stores/*` and unused `server/src/types/*` legacy models.
  - Remove dead imports and compatibility code.

- [ ] **Task 9 — Deployment docs update**
  - Update README server deployment section:
    - `VIDOS_SQLITE_PATH=/data/vidos.sqlite`
    - mount volume: `-v /host/vidos-db:/data`
  - Note WAL sidecars (`.sqlite-wal`, `.sqlite-shm`) and writable mount requirement.
  - Add recommended backup guidance for mounted DB folder.

- [ ] **Task 10 — Validation**
  - Run: `bun run check-types`, `bun run lint`, `bun run test`.
  - Manual smoke: signup, signin, session fetch, profile, payment, loan, reset.
  - Restart server and verify persistence durability.

## Risks and mitigation

- **Risk:** client breakage due to API contract redesign.
  - **Mitigation:** implement client updates in same branch; add temporary aliases only if rollout requires it.
- **Risk:** over-large modules during redesign.
  - **Mitigation:** enforce per-domain split (`schema/repository/service/route`) and keep each file focused.
- **Risk:** JSON field drift in metadata/claims.
  - **Mitigation:** strict Zod parsing for all JSON decode points.

## Acceptance criteria

- Server persistence fully SQLite-backed via Bun + Drizzle.
- No reliance on legacy store APIs, legacy server type objects, or DAO compatibility abstractions.
- Client works against redesigned API contracts.
- Data survives restarts and container redeploys with mounted storage.
- README clearly explains how to choose and mount the SQLite DB location.
- Typecheck, lint, and tests pass.
