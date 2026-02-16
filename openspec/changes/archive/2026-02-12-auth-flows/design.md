## Context

DemoBank currently has core infrastructure in place (Vidos service layer, in-memory stores, env config) but no user-facing authentication flows. Users need to sign up and sign in using authorized PID credentials from their EUDI Wallets.

The Vidos Authorizer API supports two presentation modes:
- **direct_post**: QR code / deep link flow where client polls server for completion (user scans QR or taps link, wallet posts to Vidos, server polls Vidos API)
- **dc_api**: Browser Digital Credentials API where wallet runs in-browser and response is forwarded immediately to server

Both signup and signin follow similar patterns but differ in:
- Attributes requested (full profile vs minimal identifier)
- Server behavior on completion (create user vs match existing user)
- Error handling (signin returns "no account found" if no match)

**Constraints:**
- JIT TypeScript (no build step for server/shared)
- Zod validation across all boundaries
- Method-chained Hono routes for type inference
- End-to-end type safety via `hc` RPC client
- shadcn/ui components for client UI

**Stakeholders:** Demo users, developers evaluating Vidos integration

## Goals / Non-Goals

**Goals:**
- Implement complete signup flow (request → QR/DC API → verification → user creation → session)
- Implement complete signin flow (request → QR/DC API → verification → user matching → session)
- Support both presentation modes with user-selectable toggle
- Provide clear UX for QR code display (desktop) and deep link (mobile)
- Poll Vidos API efficiently for direct_post mode completion
- Handle DC API responses by forwarding to completion endpoint
- Return actionable error when signin finds no matching user

**Non-Goals:**
- Password-based authentication (PID-only)
- Social login (Google, GitHub, etc.)
- Multi-factor authentication beyond PID verification
- Session management UI (logout, view active sessions)
- Account recovery or password reset (no passwords)
- Rate limiting or abuse prevention (add later if needed)
- Persistent mode preference (session-only is sufficient for demo)

## Decisions

### Decision 1: Two-Path Endpoint Pattern Per Flow

**Choice:** Each flow (signup, signin) uses two paths: direct_post uses `/request` + `/status/:requestId`, dc_api uses `/request` + `/complete/:requestId`.

**Why:**
- **Separation of concerns**: Request creation, polling, and completion are distinct phases with different responsibilities
- **Supports both modes**: `direct_post` uses request + status (server finalizes session when authorized), `dc_api` uses request + complete (client forwards DC API response)
- **Clear type signatures**: Each endpoint has focused input/output, easier to validate with Zod
- **Polling flexibility**: Status endpoint is stateless and idempotent, safe to poll repeatedly
- **Error isolation**: Completion failures don't affect request creation

**Alternatives considered:**
- Two endpoints (request + complete): Would require status polling via complete endpoint, conflating concerns
- Webhooks from Vidos: Requires public URL and webhook secret management, too complex for demo
- WebSocket for status: Adds persistent connection overhead, overkill for simple polling

**Implementation:**
```typescript
// Signup
POST   /api/signup/request         → { requestId, authorizationId, authorizeUrl? , dcApiRequest? , responseUrl? }
GET    /api/signup/status/:requestId → { status: "created" | "pending" | "authorized" | "rejected" | "error" | "expired", sessionId?, user?, mode? }
POST   /api/signup/complete/:requestId → { sessionId, user, mode }

// Signin (identical pattern)
POST   /api/signin/request
GET    /api/signin/status/:requestId
POST   /api/signin/complete/:requestId
```

**Signup attributes (PRD-aligned):** family_name, given_name, birth_date, birth_place, nationality, resident_address (or structured address fields), portrait (optional), personal_administrative_number (optional), document_number (optional)

**Signin attributes (PRD-aligned):** personal_administrative_number (preferred), document_number (fallback), family_name, given_name

---

### Decision 2: Client State Machine for Auth Flow

**Choice:** Use React state + useEffect for flow orchestration, not a formal state machine library.

**Why:**
- **Simple flow**: 4-5 states (idle → requesting → awaiting verification → completing → done/error)
- **Framework familiarity**: useState/useEffect is standard React, no learning curve
- **Easy to debug**: State transitions visible in React DevTools
- **Sufficient for demo**: XState or similar adds dependency overhead without clear benefit

**Alternatives considered:**
- XState: Powerful but overkill for linear auth flow
- Reducer pattern: More boilerplate than needed for simple state
- URL-based state: Route params would expose sensitive requestId in browser history

**States:**
1. `idle` - Initial state, mode selection visible
2. `requesting` - POST /request in flight
3. `awaiting_verification` - Showing QR or waiting for DC API response
4. `completing` - POST /complete in flight (dc_api mode)
5. `success` - Redirect to profile (signup) or dashboard (signin)
6. `error` - Show error message

```typescript
type AuthState = 
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "awaiting_verification"; requestId: string; authorizeUrl: string }
  | { status: "completing" }
  | { status: "success"; userId: string }
  | { status: "error"; message: string };
```

---

### Decision 3: Polling Strategy for direct_post Mode

**Choice:** Exponential backoff starting at 1s, max 5s, timeout after 5 minutes.

**Why:**
- **Fast feedback**: 1s initial interval catches quick wallet responses
- **Reduced load**: Backoff prevents hammering server if user takes time
- **Reasonable timeout**: 5min matches typical user attention span for wallet interaction
- **Simple implementation**: Standard exponential backoff pattern

**Alternatives considered:**
- Fixed 2s interval: Wastes requests if user is slow, too slow if user is fast
- Server-sent events: Requires persistent connection, not supported by `hc` client
- Aggressive 500ms polling: Unnecessary server load

**Implementation:**
```typescript
let interval = 1000; // start at 1s
const maxInterval = 5000;
const timeout = 5 * 60 * 1000; // 5min

const pollStatus = async () => {
  const result = await client.signup.status[":requestId"].$get({ param: { requestId } });
  if (result.status === "authorized") {
    // proceed to complete (or finalize session on server and return session payload)
  } else if (result.status === "rejected" || result.status === "error" || result.status === "expired") {
    // show error / retry
  } else {
    interval = Math.min(interval * 1.5, maxInterval);
    setTimeout(pollStatus, interval);
  }
};
```

Stop polling when:
- Status becomes "authorized"
- Timeout reached
- Component unmounts (cleanup in useEffect)

---

### Decision 4: QR Code Library Choice

**Choice:** Use `qrcode.react` for QR code rendering.

**Why:**
- **React-native**: Renders as React component, not imperative canvas manipulation
- **Lightweight**: ~10KB, no heavy dependencies
- **Customizable**: Supports error correction, size, colors
- **Well-maintained**: Active development, TypeScript types available

**Alternatives considered:**
- `qrcode`: Requires manual canvas element, less ergonomic in React
- `react-qr-code`: Similar to qrcode.react, less popular
- Manual SVG generation: Reinventing the wheel, error-prone

**Usage:**
```tsx
import QRCode from "qrcode.react";

<QRCode value={authorizeUrl} size={256} level="M" />
```

---

### Decision 5: DC API Feature Detection

**Choice:** Check for `navigator.credentials` and `DigitalCredential` in window at mount time.

**Why:**
- **Progressive enhancement**: Defaults to direct_post if DC API unavailable
- **Early detection**: User sees appropriate mode options immediately
- **Standard check**: Matches MDN recommendations for feature detection

**Alternatives considered:**
- Try/catch on first use: User sees error after selecting mode, poor UX
- User-agent sniffing: Brittle, doesn't detect polyfills or experimental flags
- Server-side detection: Can't reliably detect browser capabilities from server

**Implementation:**
```typescript
const isDCApiSupported = () => {
  return (
    typeof window !== "undefined" &&
    "credentials" in navigator &&
    "DigitalCredential" in window
  );
};

// Show DC API option only if supported
{isDCApiSupported() && (
  <ModeOption value="dc_api">Browser Wallet</ModeOption>
)}
```

---

### Decision 6: Mode Persistence in Session + Client Storage

**Choice:** Persist selected mode in the server session; store `sessionId` and `mode` in browser storage for client use.

**Why:**
- **Server source of truth**: Mode is reused for payment/loan flows via session
- **Client convenience**: Client can show mode without extra roundtrip when needed
- **Aligned to PRD**: Mode selection happens at signup/signin and is reused for the session

**Alternatives considered:**
- Client-only storage (no server persistence): Breaks PRD requirement to reuse mode in server flows
- Cookie-only storage: Adds CSRF/cookie concerns, not required for this demo
- React Context: Lost on page reload, fragile for demo

**Implementation:**
```typescript
const getStoredMode = (): PresentationMode => {
  return (localStorage.getItem("authMode") as PresentationMode) || "direct_post";
};

const setStoredMode = (mode: PresentationMode) => {
  localStorage.setItem("authMode", mode);
};
```

---

### Decision 7: Shared Endpoint Pattern with Flow Discriminator

**Choice:** Keep signup and signin endpoints separate (not a single `/auth` endpoint with `flow` param).

**Why:**
- **Clear intent**: URL path explicitly states signup vs signin
- **Type safety**: Separate types for signup vs signin request/response schemas
- **Authorization**: Easier to apply different rate limits or auth rules per flow
- **Routing clarity**: TanStack Router has distinct routes for `/signup` and `/signin`

**Alternatives considered:**
- Single `/auth/request` with `{ flow: "signup" | "signin" }` param: Couples unrelated flows, complicates types
- Single endpoint with different HTTP methods: Signup and signin are both POST operations, can't use method to distinguish

Both flows share internal implementation (call Vidos service), but expose separate endpoints for clarity.

---

### Decision 8: Error Handling for "No Account Found"

**Choice:** Return 404 with structured error from `/signin/complete/:requestId` when no user matches.

**Why:**
- **Semantic correctness**: 404 = "resource (user) not found"
- **Client guidance**: Error message directs user to signup
- **Typed errors**: Zod schema for error response enables type-safe handling

**Alternatives considered:**
- 401 Unauthorized: Implies auth failure, but user successfully authorized with PID (not an auth error)
- 400 Bad Request: Doesn't convey "user doesn't exist" semantically
- 200 with error flag: Misuses HTTP semantics, harder to handle in client

**Implementation:**
```typescript
// server/src/routes/signin.ts
const user = getUserByIdentifier(claims.personalAdministrativeNumber || claims.documentNumber);
if (!user) {
  return c.json(
    { error: "No account found with this identity. Please sign up first." },
    404
  );
}
```

Client shows error message and link to signup page.

## Component Structure

```
client/src/
  routes/
    signup.tsx             # Signup page, orchestrates flow
    signin.tsx             # Signin page, orchestrates flow
  components/
    auth/
      mode-selector.tsx    # Radio group for direct_post vs dc_api
      qr-code-display.tsx  # QR code with "Open on this device" link
      wallet-button.tsx    # "Open Wallet" button for mobile deep link
      dc-api-handler.tsx   # Invokes navigator.credentials.get() and forwards response
      polling-status.tsx   # Loading state during direct_post polling
  lib/
    auth-helpers.ts        # isDCApiSupported, getStoredMode, etc.

server/src/
  routes/
    signup.ts              # POST /request, GET /status/:id, POST /complete/:id
    signin.ts              # POST /request, GET /status/:id, POST /complete/:id
  stores/
    pendingRequests.ts     # Maps requestId → { authId, mode, flow }
    # users.ts, sessions.ts already exist from core-infrastructure

shared/src/
  api/
    signup.ts              # Schemas for signup endpoints
    signin.ts              # Schemas for signin endpoints
  types/
    auth.ts                # PresentationMode, AuthFlowState, ExtractedClaims
```

## Data Flow

### Sequence: Signup with direct_post Mode

```
User                 Client                  Server                  Vidos API
  |                     |                       |                         |
  |--[Select mode]----->|                       |                         |
  |                     |                       |                         |
  |--[Click "Sign Up"]->|                       |                         |
  |                     |---POST /signup/req--->|                         |
  |                     |                       |---createAuthReq-------->|
  |                     |                       |<--{authId, url}---------|
  |                     |                       | [store in pendingReqs]  |
  |                     |<--{requestId, url}----|                         |
  |                     |                       |                         |
  |                     | [show QR with url]    |                         |
  |                     | [start polling]       |                         |
  |                     |                       |                         |
  |--[scan QR]----------|----------------[wallet posts to Vidos]--------->|
  |                     |                       |                         |
  |                     |---GET /status/:id---->|                         |
  |                     |                       |---pollStatus----------->|
  |                     |                       |<--{status:pending}------|
  |                     |<--{status:pending}----|                         |
  |                     |                       |                         |
  |                     | [wait, poll again]    |                         |
  |                     |---GET /status/:id---->|                         |
  |                     |                       |---pollStatus----------->|
  |                     |                       |<--{status:authorized}---|
  |                     | [fetch credentials + create user/session] |
  |                     |<--{sessionId,user,mode}|                         |
  |                     |                       |                         |
  |--[redirect /profile]|                       |                         |
```

### Sequence: Signin with dc_api Mode

```
User                 Client                  Server                  Vidos API
  |                     |                       |                         |
  |--[Select DC API]--->|                       |                         |
  |                     |                       |                         |
  |--[Click "Sign In"]->|                       |                         |
  |                     |---POST /signin/req--->|                         |
  |                     |                       |---createAuthReq-------->|
  |                     |                       |   (mode=dc_api)         |
  |                     |                       |<--{authId, dcApiReq}----|
  |                     |                       | [store in pendingReqs]  |
  |                     |<--{requestId, dc...}--|                         |
  |                     |                       |                         |
  |                     | [call navigator.      |                         |
  |                     |  credentials.get()]   |                         |
  |                     |                       |                         |
  |--[approve in wallet]|                       |                         |
  |                     |<--[DigitalCredential]-|                         |
  |                     |                       |                         |
  |                     |---POST /complete/:id->|                         |
  |                     |   {dcResponse}        | [extractClaims]         |
  |                     |                       | [getUserByIdentifier]   |
  |                     |                       | [createSession if found]|
  |                     |<--{sessionId, user, mode}|
  |                     |    OR 404 error       |                         |
  |                     |                       |                         |
  |--[redirect or err]->|                       |                         |
```

## Shared Schemas

All schemas in `shared/src/api/`:

**signup.ts:**
```typescript
// POST /api/signup/request
export const signupRequestSchema = z.object({
  mode: z.enum(["direct_post", "dc_api"]),
});

export const signupRequestResponseSchema = z.object({
  requestId: z.string(),
  authorizationId: z.string(),
  authorizeUrl: z.string().url().optional(), // direct_post only
  dcApiRequest: z.unknown().optional(),      // dc_api only
  responseUrl: z.string().url().optional(),  // dc_api only
});

// GET /api/signup/status/:requestId
export const signupStatusResponseSchema = z.object({
  status: z.enum(["created", "pending", "authorized", "rejected", "error", "expired"]),
  sessionId: z.string().optional(),
  user: userSchema.optional(),
  mode: presentationModeSchema.optional(),
});

// POST /api/signup/complete/:requestId
export const signupCompleteRequestSchema = z.object({
  dcResponse: z.unknown().optional(), // dc_api mode only
});

export const signupCompleteResponseSchema = z.object({
  sessionId: z.string(),
  user: userSchema,
  mode: presentationModeSchema,
});
```

**signin.ts:** (same structure, different error handling)

**types/auth.ts:**
```typescript
export const presentationModeSchema = z.enum(["direct_post", "dc_api"]);
export type PresentationMode = z.infer<typeof presentationModeSchema>;

export const extractedClaimsSchema = z.object({
  familyName: z.string(),
  givenName: z.string(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  residentAddress: z.string().optional(),
  portrait: z.string().optional(), // base64
  personalAdministrativeNumber: z.string().optional(),
  documentNumber: z.string().optional(),
});
export type ExtractedClaims = z.infer<typeof extractedClaimsSchema>;
```

## Risks / Trade-offs

**[Risk]** Polling every 1-5s may feel slow if wallet response is instant  
**→ Mitigation:** Start at 1s to catch fast responses. Consider WebSocket in production.

**[Risk]** 5-minute timeout may be too short for users who need to download wallet  
**→ Mitigation:** Show "Taking too long?" message after 2min with link to restart. Timeout is per request, user can retry.

**[Risk]** DC API browser support is limited (Chrome/Edge only as of 2024)  
**→ Mitigation:** Feature detection hides option if unsupported. Default to direct_post which works everywhere.

**[Risk]** No CSRF protection on completion endpoints  
**→ Mitigation:** requestId is unguessable UUID, acts as capability token. Add CSRF tokens later if needed.

**[Risk]** SessionStorage cleared on browser close = user loses mode preference  
**→ Mitigation:** Acceptable for demo. Mode selection UI is visible on every auth page, easy to re-select.

**[Risk]** QR code may be too small on mobile or too large on desktop  
**→ Mitigation:** Use responsive sizing (max-width + aspect-ratio). Show "Open Wallet" button on mobile instead.

**[Risk]** Signin error "No account found" might confuse users who think they signed up  
**→ Mitigation:** Clear error message with explicit next action: "No account found. Please sign up first." Link directly to signup page.

**[Risk]** Polling continues if user navigates away from page  
**→ Mitigation:** useEffect cleanup cancels polling on unmount. Timeout ensures eventual stop.

**[Trade-off]** Separate signup/signin endpoints = code duplication  
**→ Benefit:** Type safety and clarity outweigh DRY principle. Shared logic extracted to Vidos service.

**[Trade-off]** No persistent mode preference = user re-selects every session  
**→ Benefit:** Simpler implementation, no privacy concerns from tracking preference.

## Migration Plan

**Prerequisites:**
- `core-infrastructure` change must be deployed and verified
- Vidos Authorizer API key and URL configured in env
- QR code library (`qrcode.react`) added to client dependencies

**Deployment steps:**
1. Install client dependencies: `bun add qrcode.react`
2. Deploy shared schemas (signup.ts, signin.ts, types/auth.ts)
3. Deploy server routes (signup.ts, signin.ts)
4. Deploy client components and routes
5. Verify server starts without errors (env validation passes)

**Rollback:**
- No database migrations, pure code rollback
- Remove new routes from server
- Remove new pages from client

**Verification:**
1. Navigate to `/signup`, verify mode selector renders
2. Select "QR Code" mode, verify QR code displays with valid URL
3. Select "Browser Wallet" (if supported), verify DC API flow triggers
4. Complete signup with test wallet, verify redirect to dashboard
5. Navigate to `/signin`, verify "no account found" error for unregistered PID
6. Complete signin with existing user, verify session created

**Monitoring:**
- Log all Vidos API calls (request creation, status polling, completion)
- Track mode selection distribution (direct_post vs dc_api usage)
- Alert on high error rates in completion endpoints

## Open Questions

1. **QR code styling:** Should QR code include DemoBank logo in center?  
   **→ Decide during implementation; plain QR is simpler and more reliable for scanning**

2. **Mobile detection:** Should server detect mobile user-agent and default to dc_api?  
   **→ No, let user choose explicitly. Feature detection on client is sufficient**

3. **Request expiration:** Should requestId expire after timeout, or persist indefinitely?  
   **→ Add TTL-based cleanup in pendingRequests store (e.g., 10min). Prevents memory leak**

4. **Claim normalization:** If Vidos returns claims with different field names, where normalize?  
   **→ In Vidos service `extractClaimsFromResponse`, before returning to routes**

5. **Portrait compression:** Should large portrait images be resized before storing?  
   **→ Not in scope for demo. If needed later, do server-side with sharp or similar**

6. **Session cookie config:** httpOnly, sameSite, secure flags?  
   **→ Defer to session implementation in core-infrastructure. Use secure defaults**
