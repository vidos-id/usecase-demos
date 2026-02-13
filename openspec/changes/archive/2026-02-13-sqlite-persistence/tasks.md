## 1. Dependencies & Configuration

- [x] 1.1 Add `drizzle-orm` to server package dependencies
- [x] 1.2 Add `drizzle-kit` to server package devDependencies
- [x] 1.3 Create `drizzle.config.ts` in repo root with sqlite dialect, schema path, migrations folder
- [x] 1.4 Add `DATABASE_PATH` to env schema in `server/src/env.ts` with default `./data/demobank.db`

## 2. Database Schema

- [x] 2.1 Create `server/src/db/schema.ts` with `users` table (balance/pendingLoansTotal as INTEGER cents)
- [x] 2.2 Add `sessions` table to schema with foreign key to users, cascade delete
- [x] 2.3 Add `pending_auth_requests` table to schema with JSON columns using `$type<T>()`
- [x] 2.4 Add indexes: sessions(user_id, expires_at), pending_auth_requests(vidos_authorization_id)
- [x] 2.5 Define Zod schemas for JSON column types (ActivityItem[], metadata, result)

## 3. Database Connection & Migrations

- [x] 3.1 Create `server/src/db/index.ts` with database connection using `bun:sqlite` + Drizzle
- [x] 3.2 Set `PRAGMA foreign_keys = ON` on connection initialization
- [x] 3.3 Add auto-migration logic using `import.meta.dir` for reliable path resolution
- [x] 3.4 Generate initial migration with `bunx drizzle-kit generate`
- [x] 3.5 Test migration applies successfully on fresh database

## 4. Store Refactoring - Users

- [x] 4.1 Refactor `createUser` to insert into database, generate seeded activity as JSON, store cents
- [x] 4.2 Refactor `getUserById` to query database, parse activity JSON with Zod
- [x] 4.3 Refactor `getUserByIdentifier` to query database by identifier column
- [x] 4.4 Refactor `updateUser` to update database row (wrap activity updates in transaction)
- [x] 4.5 Refactor `clearAllUsers` to delete all rows from users table
- [x] 4.6 Add helper to convert cents <-> dollars for API layer

## 5. Store Refactoring - Sessions

- [x] 5.1 Refactor `createSession` to insert into database with calculated expiration
- [x] 5.2 Refactor `getSessionById` to query database with expiration check
- [x] 5.3 Refactor `deleteSession` to delete row from database
- [x] 5.4 Refactor `clearAllSessions` to delete all rows from sessions table

## 6. Store Refactoring - Pending Auth Requests

- [x] 6.1 Refactor `createPendingRequest` to insert into database with JSON metadata
- [x] 6.2 Refactor `getPendingRequestById` to query database with TTL expiration check
- [x] 6.3 Refactor `getPendingRequestByAuthId` to query by vidos_authorization_id with expiration
- [x] 6.4 Refactor `updateRequestToCompleted` to update row with result JSON
- [x] 6.5 Refactor `updateRequestToFailed` to update row with error in result JSON
- [x] 6.6 Refactor `deletePendingRequest` and clear function for admin reset

## 7. API Layer & Types

- [x] 7.1 Keep `shared/src/api/` schemas independent (no imports from server)
- [x] 7.2 Add server-side mappers: DB row -> API response (cents to dollars, etc.)
- [x] 7.3 Verify API response schemas still match after refactor
- [x] 7.4 Clean up `server/src/types/` - keep or remove based on usage

## 8. Deployment & Documentation

- [x] 8.1 Update `Dockerfile.server` to create `/app/data` directory
- [x] 8.2 Add DB section to `server/AGENTS.md` with drizzle-kit commands
- [x] 8.3 Update root `AGENTS.md` or README with volume mount instructions for deployment

## 9. Verification

- [x] 9.1 Run `bun run check-types` - ensure no type errors
- [x] 9.2 Test signup/signin flows persist across server restart
- [x] 9.3 Test payment/loan flows update user balance and activity in database
- [x] 9.4 Test admin reset clears all tables
