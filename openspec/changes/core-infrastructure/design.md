## Context

DemoBank is a demo application showcasing PID-based authentication via Vidos Authorizer. The server is a Hono API running on Bun with no build step (JIT TypeScript). Currently, the server has basic routing (`routes/hello`, `routes/other`) but no user management, session handling, or external service integration.

This change establishes core infrastructure needed before implementing authentication flows. The Vidos Authorizer API integration supports two presentation modes:
- **direct_post**: QR code / deep link flow where client polls for completion
- **dc_api**: Browser Digital Credentials API where response is forwarded immediately

Credentials may be in SD-JWT VC or ISO/IEC 18013-5 mdoc format.

**Constraints:**
- JIT packages: `shared` and `server` export `.ts` directly, no compilation
- Zod validation across all boundaries (established pattern in project)
- Method-chained Hono routes to preserve type inference for `hc` client
- Bun runtime with native TypeScript support

## Goals / Non-Goals

**Goals:**
- In-memory data structures for users, sessions, and pending authorization requests
- Environment configuration with validation for Vidos Authorizer URL and API key
- Service layer for Vidos API with typed methods for both presentation modes
- Support extracting claims from SD-JWT VC and mdoc formats
- Fail-fast on missing or invalid environment variables at server startup

**Non-Goals:**
- Database persistence (demo app, ephemeral by design)
- Authentication endpoints (handled in `auth-flows` change)
- Session expiration background jobs (manual cleanup acceptable for demo)
- Retry logic or circuit breakers for Vidos API calls (add if needed later)
- Comprehensive error recovery (happy path first)

## Decisions

### Decision 1: In-Memory Stores Using Map-Based Singletons

**Choice:** Implement stores as singleton ES6 Maps exported from `server/src/stores/` modules.

**Why:**
- Demo application doesn't require persistence across restarts
- Simplifies setup (no database dependency)
- Fast lookups by ID
- Matches ephemeral nature of demo sessions
- Clear ownership: each store module owns its data structure

**Alternatives considered:**
- SQLite: Adds dependency, overkill for demo scope
- Class-based repositories: Unnecessary abstraction for simple CRUD
- Exported arrays: O(n) lookups, harder to maintain uniqueness

**Implementation pattern:**
```typescript
// server/src/stores/users.ts
const users = new Map<string, User>();

export const createUser = (data: Omit<User, "id" | "createdAt">) => { ... }
export const getUserById = (id: string) => users.get(id);
export const getUserByIdentifier = (identifier: string) => { ... }
```

Each store exports functions that encapsulate Map operations.

---

### Decision 2: Zod for Environment Validation

**Choice:** Define environment schema in `server/src/env.ts` using Zod, validate on module import.

**Why:**
- Consistent with project's validation strategy (all boundaries use Zod)
- Type-safe access: `env.VIDOS_AUTHORIZER_URL` is statically typed
- Fail-fast: Server won't start with invalid config
- Single source of truth for required variables

**Alternatives considered:**
- dotenv-safe: Less type-safe, requires separate declaration
- Manual checks: Error-prone, no type inference
- Runtime validation per request: Too late to catch config errors

**Implementation:**
```typescript
// server/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  VIDOS_AUTHORIZER_URL: z.string().url(),
  VIDOS_API_KEY: z.string().min(1),
  // ... other vars
});

export const env = envSchema.parse(process.env);
```

Import `env` anywhere config is needed. Server crashes immediately if validation fails.

---

### Decision 3: Vidos Service as Singleton with Typed Methods

**Choice:** Implement `server/src/services/vidos.ts` as a module exporting async functions, not a class.

**Why:**
- No state to manage (API key comes from env, no connection pooling needed)
- Simpler testing (easier to mock module exports than class instances)
- Consistent with functional style of stores
- Native `fetch` API is already async, no need for wrapper class

**Alternatives considered:**
- Class with constructor injection: Over-engineered for stateless HTTP calls
- Separate service per mode: Creates duplication, modes share most logic

**Methods:**
```typescript
export const createAuthorizationRequest = async (params: { ... }) => { ... }
export const pollAuthorizationStatus = async (authId: string) => { ... }
export const extractClaimsFromResponse = (response: VidosResponse) => { ... }
```

Use native `fetch` with `VIDOS_AUTHORIZER_URL` and `VIDOS_API_KEY` from `env`.

---

### Decision 4: Unified Claim Extraction for SD-JWT VC and mdoc

**Choice:** Single `extractClaimsFromResponse` function that handles both formats.

**Why:**
- Vidos response includes `format` field indicating credential type
- Both formats contain same logical claims (familyName, givenName, birthDate, etc.)
- Centralized parsing logic reduces duplication across auth endpoints
- Returns normalized `{ familyName, givenName, ... }` regardless of format

**Alternatives considered:**
- Separate extractors per format: More code, harder to maintain type consistency
- Push format handling to caller: Leaks credential format details into business logic

**Implementation approach:**
- Parse SD-JWT VC using JWT decode + SD-JWT disclosure expansion
- Parse mdoc using CBOR decoder (may need `cbor` package)
- Normalize field names (e.g., `family_name` → `familyName`)
- Return shared interface `ExtractedClaims`

---

### Decision 5: Error Handling Strategy

**Choice:** Let Vidos API errors propagate as exceptions, catch at route handler level.

**Why:**
- Aligns with Hono's error handling (middleware can catch)
- Route handlers decide how to map errors to HTTP responses
- Service layer stays simple, no error wrapping
- Easy to add global error handler later if needed

**Alternatives considered:**
- Result types (Ok/Err): Adds boilerplate, not idiomatic in TypeScript ecosystem
- Service-level error mapping: Couples service to HTTP concerns

Throw descriptive errors from service (e.g., `throw new Error("Vidos API request failed: ...")`), let routes return appropriate status codes.

## Risks / Trade-offs

**[Risk]** In-memory storage means all data lost on server restart  
**→ Mitigation:** Acceptable for demo. Document clearly. Add persistence later if needed.

**[Risk]** No session expiration cleanup = memory leak over time  
**→ Mitigation:** For demo scope, manual cleanup acceptable. Add TTL-based eviction if long-running.

**[Risk]** Polling in direct_post mode may be inefficient  
**→ Mitigation:** Client controls poll interval. Consider webhooks in production version.

**[Risk]** Vidos API key in environment could be exposed in logs  
**→ Mitigation:** Never log `env.VIDOS_API_KEY`. Use structured logging with redaction if added.

**[Risk]** CBOR parsing for mdoc may require external dependency  
**→ Mitigation:** Evaluate `cbor-x` or similar. Fallback: support SD-JWT VC only initially.

**[Risk]** No retry logic for Vidos API calls = fragile to transient failures  
**→ Mitigation:** Add exponential backoff if reliability issues arise in testing.

**[Trade-off]** Singleton pattern makes testing harder (shared mutable state)  
**→ Mitigation:** Export reset functions for tests (e.g., `clearAllUsers()`). Or refactor to dependency injection later.

## Migration Plan

**Deployment:**
1. Add environment variables to deployment config:
   - `VIDOS_AUTHORIZER_URL` (e.g., `https://authorizer.vidos.dev`)
   - `VIDOS_API_KEY` (obtain from Vidos dashboard)
2. Deploy server code (no database migrations needed)
3. Server validates env on startup; crashes immediately if invalid

**Rollback:**
- No persistent state, rollback is simple code revert
- No breaking changes to existing routes

**Verification:**
- Server starts without env validation errors
- Import stores and service in test file, verify exports are accessible
- Manual test: call `createAuthorizationRequest` with mock params (requires valid API key)

## Open Questions

1. **CBOR library choice:** Which package for mdoc parsing? `cbor-x`, `cbor`, or `@stablelib/cbor`?  
   **→ Decide during implementation based on bundle size and API ergonomics**

2. **Session TTL:** Should sessions have configurable expiration, or fixed duration?  
   **→ Start with fixed 1-hour TTL, make configurable if needed**

3. **Claim schema validation:** Should extracted claims be validated with Zod?  
   **→ Yes, define `ExtractedClaimsSchema` in shared package for consistency**

4. **Polling timeout:** How long should client poll before giving up in direct_post mode?  
   **→ Defer to `auth-flows` change, depends on UX requirements**

5. **Portrait handling:** Store as base64 string, URL, or binary?  
   **→ Start with optional base64 string (simplest for demo), optimize later if needed**
