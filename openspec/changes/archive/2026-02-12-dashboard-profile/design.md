## Context

DemoBank needs user-facing pages after successful PID authentication. The `auth-flows` change handles user creation and session management (in-memory Map stores per `core-infrastructure` design). Now we need protected routes that display:
- Dashboard with fake demo data (balance, transactions)
- Profile page with PID-sourced user data (name, portrait, address, birth date)

**Current state:**
- `server/src/stores/users.ts` and `server/src/stores/sessions.ts` exist (from `core-infrastructure`)
- User model includes PID claims: `familyName`, `givenName`, `address`, `birthDate`, `nationality`, `portrait` (optional base64)
- Session store has `sessionId`, `userId`, `mode` (direct_post/dc_api)
- No endpoints yet to expose session or user data
- No protected client routes

**Constraints:**
- JIT TypeScript: no build step for server or shared
- TanStack Router for client routing
- Method-chained Hono routes to preserve `hc` client types
- Zod validation at all boundaries
- Fake data for demo purposes (no real banking backend)

## Goals / Non-Goals

**Goals:**
- Session validation endpoint (`GET /api/session`) to check auth status before rendering protected pages
- User profile endpoint (`GET /api/users/me`) to fetch current user data
- Dashboard page showing welcome message, fake balance, 2-3 transactions, action buttons
- Profile page displaying PID data including portrait (if provided)
- Account menu component with Sign Out and Reset Demo Data actions
- Fake transaction generator for realistic demo data

**Non-Goals:**
- Real transaction history (no database, purely demo data)
- Payment and loan flows themselves (implemented in `payment-flow` and `loan-flow` changes)
- Session expiration UI (assume sessions don't expire during demo)
- Multiple accounts per user (single fake account hardcoded)
- Transaction filtering/search (static list display only)

## Decisions

### Decision 1: Session Endpoint vs Middleware-Only Auth

**Choice:** Expose `GET /api/session` endpoint returning session status + mode.

**Why:**
- Client needs to know presentation mode to display "Authenticated via QR Code" vs "Authenticated via Digital Credentials API"
- TanStack Router's `beforeLoad` can call session endpoint to guard protected routes
- Separates auth validation from data fetching (cleaner than bundling into `/api/users/me`)
- Allows future clients (mobile app) to check session without fetching full user profile

**Alternatives considered:**
- Middleware-only: No way for client to detect session mode or handle auth failures gracefully
- Embed in `/api/users/me`: Couples user data with session metadata, harder to extend

**Implementation:**
```typescript
// shared/src/api/session.ts
export const sessionResponseSchema = z.object({
  authenticated: z.boolean(),
  userId: z.string().optional(),
  mode: z.enum(["direct_post", "dc_api"]).optional(),
});

// server/src/index.ts (chained on app)
.get("/api/session", (c) => {
  const authHeader = c.req.header("Authorization");
  const sessionId = authHeader?.replace("Bearer ", "");
  if (!sessionId) return c.json({ authenticated: false });

  const session = getSessionById(sessionId);
  if (!session) return c.json({ authenticated: false });

  return c.json({ authenticated: true, userId: session.userId, mode: session.mode });
})
```

Client checks session in route loader, redirects to `/` if not authenticated.

---

### Decision 2: Fake Transaction Data Strategy

**Choice:** Static array of fake transactions in `server/src/data/fakeTransactions.ts`, returned via function.

**Why:**
- Simplest approach for demo (no need for randomization or persistence)
- Realistic merchant names and amounts make demo feel polished
- Easy to extend later with filters or user-specific data if needed
- Avoids unnecessary complexity of procedural generation

**Alternatives considered:**
- Procedural generator: Overkill for demo, adds randomness users can't reproduce
- Stored in user model: Wastes memory, all users see same data anyway
- External API: Defeats purpose of self-contained demo

**Implementation:**
```typescript
// server/src/data/fakeTransactions.ts
export const getFakeTransactions = () => [
  { date: "2026-02-10", merchant: "Supermart", amount: -45.20, currency: "EUR" },
  { date: "2026-02-09", merchant: "Salary Deposit", amount: 3200.00, currency: "EUR" },
  { date: "2026-02-08", merchant: "Coffee Corner", amount: -4.50, currency: "EUR" },
];

// Endpoint returns first 3 transactions (or make configurable)
```

---

### Decision 3: Portrait Display Strategy

**Choice:** If `portrait` exists on user, display as `<img src={`data:image/jpeg;base64,${portrait}`} />`.

**Why:**
- User model already stores portrait as optional base64 string (per `core-infrastructure`)
- No additional storage or URL generation needed
- Works immediately with data URI format
- Fallback to initials if portrait missing (common pattern)

**Alternatives considered:**
- Convert to blob URL: Unnecessary complexity, no performance benefit for single image
- Store as separate file: Requires file upload handling, breaks in-memory demo model
- External service (Gravatar): Breaks offline demo, ties to email

**Implementation:**
```tsx
// client/src/components/profile/portrait-display.tsx
{user.portrait ? (
  <img src={`data:image/jpeg;base64,${user.portrait}`} alt={user.givenName} />
) : (
  <div className="initials">{user.givenName[0]}{user.familyName[0]}</div>
)}
```

Assume portrait is JPEG (PID standard), adjust MIME type if needed.

---

### Decision 4: Protected Route Pattern

**Choice:** Use TanStack Router's `_auth` layout route with `beforeLoad` hook.

**Why:**
- Standard pattern in TanStack Router for route protection
- Centralizes session check in single place
- Nested routes inherit protection automatically
- Redirect to `/` handled declaratively, no per-route boilerplate

**Alternatives considered:**
- Per-route loaders: Duplicates session check across dashboard and profile
- Client-side-only check: No loader data, causes flash of unprotected content
- HOC wrapper: Less idiomatic with TanStack Router, harder to type

**Structure:**
```
client/src/routes/
  _auth.tsx         # Layout route with beforeLoad session check
  _auth/
    dashboard.tsx   # Protected dashboard route
    profile.tsx     # Protected profile route
```

`_auth.tsx` loader calls `GET /api/session`, redirects if `authenticated: false`.

---

### Decision 5: Account Menu Component Location

**Choice:** Place `account-menu.tsx` in `client/src/components/layout/` (not `ui/`).

**Why:**
- Not a generic UI primitive (specific to DemoBank account context)
- Contains business logic (sign out, reset demo data actions)
- Used in layout/header, not reusable across projects like shadcn components

**Alternatives considered:**
- `components/ui/`: Wrong semantic layer, ui/ is for design system primitives
- Inline in dashboard: Menu needed in profile page too, would duplicate

Menu shows in header of all `_auth` routes, includes dropdown with Sign Out and Reset options.

---

### Decision 6: Shared Schemas Structure

**Choice:** One schema file per endpoint under `shared/src/api/`.

**Why:**
- Matches existing pattern in project (no barrel files, subpath exports)
- Clean import in client: `import { sessionResponseSchema } from "shared/api/session"`
- No circular dependencies
- Easy to find schema for given endpoint

**Files:**
```
shared/src/api/
  session.ts         # sessionResponseSchema
  users-me.ts        # userProfileResponseSchema
  transactions.ts    # transactionSchema (if needed for typing)
```

Export from `package.json` via subpaths:
```json
"exports": {
  "./api/session": "./src/api/session.ts",
  "./api/users-me": "./src/api/users-me.ts"
}
```

## Risks / Trade-offs

**[Risk]** Fake transaction data is static → all users see identical transactions  
**→ Mitigation:** Acceptable for demo scope. Document clearly. Could add user-specific randomization later if needed.

**[Risk]** No session expiration check → stale sessions may remain valid indefinitely  
**→ Mitigation:** Demo sessions are ephemeral (server restart clears). Add TTL in future if demo runs long-term.

**[Risk]** Base64 portrait in JSON response → large payload if high-res image  
**→ Mitigation:** PID portraits are typically small (~50KB). Monitor response size, optimize if needed.

**[Risk]** Account menu actions depend on admin reset endpoints  
**→ Mitigation:** Implement `admin-reset` change alongside this change to keep menu actions functional.

**[Trade-off]** Dashboard shows hardcoded EUR 12,450.00 balance → not personalized  
**→ Acceptable:** Demo app, not real banking. Simplifies implementation, consistent across demos.

**[Trade-off]** Action buttons depend on payment/loan flows  
**→ Acceptable:** These routes are implemented in `payment-flow` and `loan-flow` changes; link to those pages once available.

## Migration Plan

**Deployment:**
1. Deploy server changes (new endpoints method-chained on existing app)
2. Deploy client changes (new routes + components)
3. No data migration needed (in-memory stores)

**Rollback:**
- No breaking changes to existing endpoints
- New routes are additive, can revert by restoring previous client bundle

**Verification:**
1. Server starts without errors
2. `GET /api/session` returns `{ authenticated: false }` when not logged in
3. After auth flow, `GET /api/session` returns `{ authenticated: true, userId, mode }`
4. Dashboard page loads with welcome message, fake balance, transactions
5. Profile page displays PID data including portrait (if provided)
6. Account menu appears in header with Sign Out option

## Open Questions

1. **Transaction count:** Show exactly 3 transactions or make configurable?  
   **→ Start with fixed 3, add pagination later if needed**

2. **Action button behavior:** Should buttons link to placeholder pages or show toast message?  
   **→ Decide during implementation based on UX feedback**

3. **Portrait size limit:** Should server validate base64 portrait size?  
   **→ No validation initially, PID provider handles constraints**

4. **Reset Demo Data scope:** Reset only current user or entire server state?  
   **→ Entire server state (all users and sessions), per PRD**

5. **Welcome message for returning users:** Show "Welcome back" vs "Welcome" based on user age?  
   **→ Start with simple "Welcome, [name]", enhance later if desired**
