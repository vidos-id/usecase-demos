# SQLite Database

### Requirement: Database Connection
The system SHALL establish a SQLite database connection using Bun's native `bun:sqlite` driver with Drizzle ORM.

#### Scenario: Database initialization
- **WHEN** server starts
- **THEN** system opens SQLite database at path specified by `DATABASE_PATH` environment variable
- **THEN** system creates database file if it does not exist
- **THEN** system executes `PRAGMA foreign_keys = ON` to enable foreign key enforcement

#### Scenario: Default database path
- **WHEN** `DATABASE_PATH` environment variable is not set
- **THEN** system uses default path `./data/demobank.db`

### Requirement: Automatic Migrations
The system SHALL automatically apply pending migrations on server startup.

#### Scenario: Apply pending migrations
- **WHEN** server starts and migrations folder contains unapplied migrations
- **THEN** system applies all pending migrations in order
- **THEN** system logs applied migrations

#### Scenario: No pending migrations
- **WHEN** server starts and all migrations are already applied
- **THEN** system continues startup without errors

#### Scenario: Migration failure
- **WHEN** a migration fails to apply
- **THEN** system logs the error and exits with non-zero status

### Requirement: Drizzle Configuration
The system SHALL provide a `drizzle.config.ts` file for migration generation.

#### Scenario: Generate migrations
- **WHEN** developer runs `bunx drizzle-kit generate`
- **THEN** system generates SQL migration files in `server/src/db/migrations/`
- **THEN** migration files reflect schema changes from `server/src/db/schema.ts`

### Requirement: Users Table Schema
The system SHALL define a `users` table with required fields for user data.

#### Scenario: Users table structure
- **WHEN** database is initialized
- **THEN** `users` table contains columns: `id` (TEXT PRIMARY KEY), `identifier` (TEXT UNIQUE NOT NULL), `document_number` (TEXT), `family_name` (TEXT NOT NULL), `given_name` (TEXT NOT NULL), `birth_date` (TEXT NOT NULL), `nationality` (TEXT NOT NULL), `email` (TEXT), `address` (TEXT), `portrait` (TEXT), `balance_cents` (INTEGER DEFAULT 0), `pending_loans_total_cents` (INTEGER DEFAULT 0), `activity` (TEXT JSON), `created_at` (TEXT NOT NULL)

### Requirement: Sessions Table Schema
The system SHALL define a `sessions` table with foreign key to users.

#### Scenario: Sessions table structure
- **WHEN** database is initialized
- **THEN** `sessions` table contains columns: `id` (TEXT PRIMARY KEY), `user_id` (TEXT NOT NULL REFERENCES users), `mode` (TEXT NOT NULL), `created_at` (TEXT NOT NULL), `expires_at` (TEXT NOT NULL)
- **THEN** `sessions` table has index on `user_id` and `expires_at`

#### Scenario: Cascade delete sessions
- **WHEN** a user is deleted
- **THEN** all sessions for that user are automatically deleted

### Requirement: Pending Auth Requests Table Schema
The system SHALL define a `pending_auth_requests` table for authorization flow state.

#### Scenario: Pending auth requests table structure
- **WHEN** database is initialized
- **THEN** `pending_auth_requests` table contains columns: `id` (TEXT PRIMARY KEY), `vidos_authorization_id` (TEXT UNIQUE NOT NULL), `type` (TEXT NOT NULL), `mode` (TEXT NOT NULL), `status` (TEXT NOT NULL DEFAULT 'pending'), `response_url` (TEXT), `metadata` (TEXT JSON), `created_at` (TEXT NOT NULL), `completed_at` (TEXT), `result` (TEXT JSON)
- **THEN** table has index on `vidos_authorization_id`

### Requirement: API Schema Separation
The system SHALL maintain separate API Zod schemas in `shared/` independent of Drizzle DB schemas.

#### Scenario: API schema independence
- **WHEN** API response schema is defined
- **THEN** schema is defined in `shared/src/api/` without importing from server package
- **THEN** API schema may differ from DB schema (omit fields, rename, transform)

#### Scenario: Server-side mapping
- **WHEN** server returns API response
- **THEN** server maps DB row to API schema (e.g., cents to dollars for balance)
- **THEN** server validates response against API schema before sending

### Requirement: JSON Column Type Safety
The system SHALL use Drizzle `$type<T>()` and Zod parsing for JSON columns.

#### Scenario: JSON column reading
- **WHEN** reading `activity`, `metadata`, or `result` JSON columns
- **THEN** system parses JSON string and validates with Zod schema
- **THEN** system returns typed object or throws validation error

#### Scenario: JSON column writing
- **WHEN** writing to JSON columns
- **THEN** system serializes object to JSON string
