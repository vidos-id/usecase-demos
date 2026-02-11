## Context

DemoBank needs loan application functionality with PID-based identity verification. The `auth-flows` change established the session mode pattern (direct_post vs dc_api) and `core-infrastructure` provides the Vidos service layer. This change adds a loan application form with inline PID verification, following the same verification pattern established in auth flows.

**Current state:**
- Session mode stored in session and client storage (from `auth-flows`)
- Vidos service exists with `createAuthorizationRequest` and `pollAuthorizationStatus` methods
- User model includes PID claims: `familyName`, `givenName`, `personalAdministrativeNumber`, `documentNumber`
- No loan-related endpoints or UI

**Constraints:**
- JIT TypeScript: no build step for server or shared
- TanStack Router for client routing
- Method-chained Hono routes to preserve `hc` client types
- Zod validation at all boundaries
- Reuse existing verification flow (same attributes as payment verification)

**Stakeholders:** Demo users, developers evaluating Vidos integration for loan applications

## Goals / Non-Goals

**Goals:**
- Loan application form with preset amounts (EUR 5k/10k/25k/50k), purpose options, term selection
- Explicit verify step after submit (inline state is acceptable as the "Verify Identity" step)
- Reuse session mode from existing session (direct_post or dc_api)
- Server endpoints to initiate loan requests and handle authorization status
- Success page with clear "application submitted" message
- Type-safe loan options as constants/enums

**Non-Goals:**
- Actual loan processing or credit checks (backend business logic)
- Loan status tracking or approval workflow
- Integration with banking systems
- Multi-step loan forms (keep single page)
- Loan history or existing loans display
- Editable loan amounts (preset dropdown only)

## Decisions

### Decision 1: Inline Verification vs Separate Confirm Page

**Choice:** Inline verification on `/loan` page (no separate `/loan/confirm` route), but UI still presents a distinct "Verify Identity" step per PRD.

**Why:**
- Simpler flow: user fills form → submits → sees explicit "Verify Identity" prompt on same page
- Fewer route transitions = less state to manage
- Matches payment verification pattern (keep consistency)
- Form data held in React state during verification, no need to pass via route params

**Alternatives considered:**
- Separate `/loan/confirm` page: Extra route adds complexity, no UX benefit
- Review page before verification: Loan form is simple enough (3 fields), review step is overkill

**Implementation:**
```tsx
// client/src/routes/_auth/loan/index.tsx
const [state, setState] = useState<"form" | "verifying" | "success">("form");

// User submits form → setState("verifying") → show QR/DC API UI inline
```

---

### Decision 2: Loan Options as Type-Safe Constants

**Choice:** Define loan amounts, purposes, and terms as const arrays exported from shared.

**Why:**
- Type-safe dropdowns: client and server share same allowed values
- Easy to extend (add new amounts or purposes in one place)
- Zod enum validation automatically derived from const arrays
- No magic strings scattered across codebase

**Alternatives considered:**
- Hardcoded in component: Client/server values could drift, no single source of truth
- Database-driven options: Overkill for demo, static options are sufficient
- Numeric ranges: Preset amounts are clearer for demo UX than free-form input

**Implementation:**
```typescript
// shared/src/types/loan.ts
export const LOAN_AMOUNTS = [5000, 10000, 25000, 50000] as const;
export const LOAN_PURPOSES = ["Car", "Home Improvement", "Education", "Other"] as const;
export const LOAN_TERMS = [12, 24, 36, 48] as const;

export type LoanAmount = typeof LOAN_AMOUNTS[number];
export type LoanPurpose = typeof LOAN_PURPOSES[number];
export type LoanTerm = typeof LOAN_TERMS[number];

// Zod schemas
export const loanAmountSchema = z.enum([...LOAN_AMOUNTS.map(String)] as [string, ...string[]]).transform(Number);
export const loanPurposeSchema = z.enum(LOAN_PURPOSES);
export const loanTermSchema = z.enum([...LOAN_TERMS.map(String)] as [string, ...string[]]).transform(Number);
```

---

### Decision 3: Three-Endpoint Pattern (Same as Auth Flows)

**Choice:** Loan flow has three endpoints: `/request`, `/status/:requestId`, `/complete/:requestId`.

**Why:**
- Proven pattern from auth-flows: separates concerns cleanly
- Supports both presentation modes (direct_post polling + dc_api callback)
- Status endpoint is stateless and idempotent (safe to poll)
- Completion endpoint handles user creation vs verification differently (loan just stores request)

**Alternatives considered:**
- Two endpoints (request + complete): No way to poll status for direct_post mode
- Single endpoint with action param: Conflates different responsibilities, complicates types

**Implementation:**
```typescript
// Loan endpoints (mirroring signup/signin pattern)
POST   /api/loan/request           → { requestId, authorizeUrl?, dcApiRequest? }
GET    /api/loan/status/:requestId → { status: "created" | "pending" | "authorized" | "rejected" | "error" | "expired", claims?: ExtractedClaims }
POST   /api/loan/complete/:requestId → { loanRequestId, message }
```

---

### Decision 4: Loan Details in Authorization Metadata

**Choice:** Include loan amount, purpose, and term in Vidos authorization request metadata.

**Why:**
- Audit trail: Vidos logs include context of what verification was for
- Future extension: Could retrieve metadata from Vidos API if needed
- Debugging: Easier to trace which verification corresponds to which loan
- Follows Vidos API best practices (metadata field is designed for this)

**Alternatives considered:**
- Store only in pendingRequests map: Metadata lost after completion, no audit trail
- Separate loan requests store: Adds complexity, metadata field is sufficient
- Omit metadata: Miss opportunity for better observability

**Implementation:**
```typescript
// server/src/routes/loan.ts
const { authId, authorizeUrl } = await vidosService.createAuthorizationRequest({
  mode,
  attributes: ["family_name", "given_name", "personal_administrative_number", "document_number"],
  metadata: {
    type: "loan_application",
    amount: amount,
    purpose: purpose,
    term: term,
  },
});
```

---

### Decision 5: Success Page Message Copy

**Choice:** "Application Submitted" heading with "We'll review your application and contact you within 2 business days" subtext.

**Why:**
- Sets clear expectations (no instant approval)
- Realistic banking UX (reviews take time)
- Avoids misleading user that loan is approved
- Professional tone appropriate for financial demo

**Alternatives considered:**
- "Loan Approved!": Misleading, no actual credit check occurred
- Vague "We'll be in touch": Doesn't set timeline expectation
- "Pending Review": More accurate but less friendly

**Implementation:**
```tsx
// client/src/routes/_auth/loan/success.tsx
<h1>Application Submitted</h1>
<p>We'll review your application and contact you within 2 business days.</p>
<Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
```

---

### Decision 6: Session Mode Reuse vs User Selection

**Choice:** Automatically reuse mode from current session (no mode selector on loan page).

**Why:**
- User already selected mode during auth (stored in session and client storage)
- Consistent verification experience (don't switch modes mid-session)
- Simpler UX (one less choice to make)
- Payment verification will follow same pattern (consistency across flows)

**Alternatives considered:**
- Let user choose mode per transaction: Confusing, adds unnecessary friction
- Always use direct_post: Ignores DC API availability and user preference
- Check if session mode still valid: Overcomplicates, session storage is authoritative

**Implementation:**
```typescript
// client/src/routes/_auth/loan/index.tsx
const storedMode = getStoredMode(); // from auth-helpers (client storage)

const handleSubmit = async () => {
  const result = await client.loan.request.$post({ json: { mode: storedMode, amount, purpose, term } });
  // ... proceed with verification using stored mode
};
```

---

### Decision 7: Component Structure

**Choice:** Loan form and verification in single component (`/loan/index.tsx`), success as separate route.

**Why:**
- Form → verification transition is state-driven (no route change)
- Success page is distinct destination (different intent, allows back navigation)
- Keeps related logic colocated (form submission + verification handling)
- Cleaner than extracting tiny sub-components

**Alternatives considered:**
- Separate form and verification components: Adds props drilling, no clear benefit
- Success as modal: Less standard UX, harder to navigate away
- Three separate routes: Over-routing for simple linear flow

**Structure:**
```
client/src/
  routes/_auth/loan/
    index.tsx      # Form with inline verification (stateful)
    success.tsx    # Confirmation page (stateless)
  components/loan/
    loan-options.ts   # Exported constants (amounts, purposes, terms)
```

## Shared Schemas

All schemas in `shared/src/api/loan.ts`:

```typescript
// POST /api/loan/request
export const loanRequestSchema = z.object({
  mode: z.enum(["direct_post", "dc_api"]),
  amount: loanAmountSchema,
  purpose: loanPurposeSchema,
  term: loanTermSchema,
});

export const loanRequestResponseSchema = z.object({
  requestId: z.string(),
  authorizeUrl: z.string().url().optional(), // direct_post only
  dcApiRequest: z.unknown().optional(),      // dc_api only
});

// GET /api/loan/status/:requestId
export const loanStatusResponseSchema = z.object({
  status: z.enum(["created", "pending", "authorized", "rejected", "error", "expired"]),
  claims: extractedClaimsSchema.optional(), // from shared/types/auth.ts
});

// POST /api/loan/complete/:requestId
export const loanCompleteRequestSchema = z.object({
  dcResponse: z.unknown().optional(), // dc_api mode only
});

export const loanCompleteResponseSchema = z.object({
  loanRequestId: z.string(), // Internal tracking ID (not exposed to user)
  message: z.string(),       // "Application submitted successfully"
});
```

## Data Flow

### Sequence: Loan Application with direct_post Mode

```
User                 Client                  Server                  Vidos API
  |                     |                       |                         |
  |--[fill form]------->|                       |                         |
  |                     | [amount: 25k, car]    |                         |
  |                     |                       |                         |
  |--[Submit]---------->|                       |                         |
  |                     |---POST /loan/req----->|                         |
  |                     |  {mode, amt, pur, tm} |                         |
  |                     |                       |---createAuthReq-------->|
  |                     |                       |  metadata: loan details |
  |                     |                       |<--{authId, url}---------|
  |                     |                       | [store in pendingReqs]  |
  |                     |<--{requestId, url}----|                         |
  |                     |                       |                         |
  |                     | [show QR inline]      |                         |
  |                     | [start polling]       |                         |
  |                     |                       |                         |
  |--[scan QR]----------|----------------[wallet posts to Vidos]--------->|
  |                     |                       |                         |
  |                     |---GET /status/:id---->|                         |
  |                     |                       |---pollStatus----------->|
  |                     |                       |<--{status:authorized}---|
  |                     |<--{status:authorized}-|                         |
  |                     |                       |                         |
  |                     |---POST /complete/:id->|                         |
  |                     |                       | [fetch credentials +    |
  |                     |                       |  log loan application]  |
  |                     |                       | [cleanup pendingReqs]   |
  |                     |<--{loanRequestId}-----|                         |
  |                     |                       |                         |
  |--[redirect /success]|                       |                         |
```

## Risks / Trade-offs

**[Risk]** No actual loan processing → users may expect approval status  
**→ Mitigation:** Clear messaging that application is submitted for review. No "Check Status" button (keeps expectations realistic).

**[Risk]** Loan details stored in Vidos metadata only → no persistence after demo restart  
**→ Mitigation:** Acceptable for demo scope. Document that loan applications are not persisted. Could add in-memory store later if needed.

**[Risk]** Reusing session mode assumes session storage is still valid  
**→ Mitigation:** If storage cleared, fallback to default (direct_post). User can re-authenticate to set mode again.

**[Risk]** Fixed loan amounts may not match user expectations (custom amounts)  
**→ Mitigation:** Preset amounts simplify demo UX and are common in real loan applications. "Other" purpose allows flexibility.

**[Trade-off]** Inline verification = user can't navigate away during verification  
**→ Benefit:** Simpler state management, reduces chance of abandonment mid-flow.

**[Trade-off]** No loan history or status tracking  
**→ Acceptable:** Demo focused on verification flow, not loan lifecycle management. Keeps scope bounded.

## Migration Plan

**Prerequisites:**
- `auth-flows` change deployed (session mode storage in session storage)
- `core-infrastructure` change deployed (Vidos service)
- Protected routes working (loan form is under `_auth` layout)

**Deployment steps:**
1. Deploy shared schemas (`shared/src/api/loan.ts`, `shared/src/types/loan.ts`)
2. Deploy server routes (`server/src/routes/loan.ts`, method-chained on app)
3. Deploy client components and routes (`client/src/routes/_auth/loan/`)
4. Verify server starts without errors

**Rollback:**
- No database migrations (purely in-memory)
- Remove new routes from server (break method chain)
- Remove new pages from client bundle

**Verification:**
1. Navigate to `/loan` (authenticated), verify form renders with dropdowns
2. Select EUR 25,000, Car, 24 months → submit
3. Verify QR code displays (direct_post) or DC API triggers (dc_api)
4. Complete verification, verify redirect to `/loan/success`
5. Check success message displays correctly
6. Click "Return to Dashboard", verify navigation works

**Monitoring:**
- Log all loan verification requests with metadata
- Track completion rate (request → complete)
- Alert if high failure rate on complete endpoint

## Open Questions

1. **Dropdown default values:** Should amount/purpose/term have sensible defaults selected?  
   **→ Start with no default (forces user to make choice), adjust based on UX feedback**

2. **Loan term display format:** Show "24 months" or "2 years"?  
   **→ Use months (simpler, matches banking standard)**

3. **Success page action buttons:** Only "Return to Dashboard" or also "Apply for Another Loan"?  
   **→ Start with single action (simpler), add more if users request**

4. **Error handling for incomplete verification:** What if user closes QR without completing?  
   **→ Show timeout message after 5min (same as auth flow), offer "Try Again" button**

5. **Should loan form be accessible from navigation menu?**  
   **→ Defer to landing-navigation change, likely yes (main action for demo)**
