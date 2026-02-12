## Context

DemoBank now has complete authentication flows (signup/signin via EUDI Wallet) with support for both presentation modes (`direct_post` and `dc_api`). Users can create accounts and sign in using authorized PID credentials. The selected presentation mode is stored in the user's session during authentication.

Now we need to implement **payment authorization** - allowing users to send money transfers that are confirmed with PID-based identity verification. This demonstrates Use Case 5 from the PRD: financial transactions authorized with PID identity attributes instead of traditional 2FA methods.

The payment flow follows the same Vidos authorization pattern as auth-flows, but differs in:
- **Purpose**: Transaction confirmation (not authentication)
- **Attributes requested**: Minimal set (family_name, given_name, identifier) vs full profile
- **Mode reuse**: Uses the presentation mode already stored in session (no re-selection)
- **Pre-filled templates**: Recipient suggestions for common payees

**Constraints:**
- JIT TypeScript (no build step for server/shared)
- Zod validation across all boundaries
- Method-chained Hono routes for type inference
- End-to-end type safety via `hc` RPC client
- Reuse auth-flows verification patterns (request + status polling for direct_post, request + complete for dc_api)
- Session must exist (all routes are auth-protected)

**Stakeholders:** Demo users, developers evaluating Vidos payment authorization

## Goals / Non-Goals

**Goals:**
- Implement payment form with editable recipient field and pre-filled templates
- Implement payment confirmation page with "Confirm with EUDI Wallet" button
- Reuse session-stored presentation mode (direct_post or dc_api) from auth
- Support same three-endpoint pattern as auth flows (request → status → complete)
- Request minimal PID attributes for transaction confirmation
- Display transaction success page with details
- Show clear error messages if verification fails or times out

**Non-Goals:**
- Actual money transfer logic or balance updates (demo remains static)
- Transaction history or persistence beyond success page
- Edit transaction after confirmation started
- Multi-currency support (EUR only)
- Recipient validation against real accounts
- Transaction limits or fraud detection
- Ability to change presentation mode during payment (always uses session mode)
- Recipient address book or saved templates (templates are hardcoded)

## Decisions

### Decision 1: Reuse Session Mode (No Re-Selection)

**Choice:** Payment flow always uses the presentation mode stored in the user's session from signup/signin. No mode selection UI in payment flow.

**Why:**
- **Consistency**: User expects same wallet interaction pattern as login
- **Reduced friction**: No cognitive overhead choosing mode again
- **Simpler UX**: Payment flow focuses on transaction details, not technical mode
- **Security assumption**: If mode worked for auth, it works for payment
- **Technical simplicity**: No need to handle mode switching mid-session

**Alternatives considered:**
- Allow mode selection per transaction: Adds UI complexity, user confusion ("which mode should I use?")
- Always use direct_post: Ignores user's proven preference and device capabilities
- Always use dc_api if supported: May fail if user's wallet isn't available in current browser

**Implementation:**
```typescript
// Server retrieves mode from session
const session = getSessionById(sessionId);
const mode = session.mode; // "direct_post" | "dc_api"

// Pass to Vidos service
const authRequest = await vidosService.createAuthorizationRequest({
  mode,
  attributes: [
    "family_name",
    "given_name",
    "personal_administrative_number",
    "document_number",
  ],
  purpose: "payment_confirmation",
});
```

---

### Decision 2: Transaction Data via URL Search Params

**Choice:** Pass transaction details (recipient, amount, reference) from `/send` to `/send/confirm` via URL search params, not React Context or client state.

**Why:**
- **Shareable URLs**: User can bookmark or share confirmation link (though session required)
- **Browser navigation**: Back button works correctly, doesn't lose transaction data
- **Simpler state**: No need for Context provider wrapping routes
- **TanStack Router native**: Uses built-in search param validation with Zod

**Alternatives considered:**
- React Context: Lost on page refresh, requires provider setup
- Client-side state (useState): Lost on navigation, needs serialization
- POST to /send/confirm: Not RESTful, complicates routing

**Implementation:**
```typescript
// client/src/routes/_auth/send/index.tsx
const navigate = useNavigate({ to: "/send/confirm" });
navigate({
  search: {
    recipient: form.recipient,
    amount: form.amount,
    reference: form.reference || undefined,
  },
});

// client/src/routes/_auth/send/confirm.tsx
const searchSchema = z.object({
  recipient: z.string(),
  amount: z.string(), // formatted EUR string
  reference: z.string().optional(),
});

export const Route = createFileRoute("/_auth/send/confirm")({
  validateSearch: searchSchema,
});
```

**Trade-off:** URL length limit (~2000 chars) constrains reference field length. Acceptable for demo.

---

### Decision 3: Hardcoded Recipient Templates

**Choice:** Pre-filled recipient templates are hardcoded in client component, not fetched from API or configurable.

**Why:**
- **Demo simplicity**: No need for template management API
- **Fast load**: No network request, templates appear instantly
- **Sufficient variety**: 2-3 templates demonstrate feature adequately
- **Easy to change**: Developer can edit templates in code

**Alternatives considered:**
- API-driven templates: Requires new endpoint, database table, CRUD UI - overkill for demo
- LocalStorage-based favorites: Requires "save recipient" feature, adds UI complexity
- Recent transactions: Requires transaction history persistence

**Implementation:**
```typescript
// client/src/components/payment/recipient-templates.tsx
const TEMPLATES = [
  { id: "coffee", name: "John's Coffee Shop", amount: "45.00" },
  { id: "maria", name: "Maria Garcia", amount: "200.00" },
  { id: "rent", name: "Apartment Rental - Oak Street", amount: "850.00" },
];
```

User clicks template → form fields auto-fill, recipient field remains editable.

---

### Decision 4: Two-Path Endpoint Pattern (Reuse from auth-flows)

**Choice:** Payment uses two paths: `direct_post` uses `/request` + `/status/:requestId` (polling), `dc_api` uses `/request` + `/complete/:requestId` (forward DC API response).

**Why:**
- **Code reuse**: Same polling logic, DC API handler, completion flow
- **Developer familiarity**: Team already understands pattern from auth implementation
- **Consistent architecture**: All Vidos flows follow same structure
- **Proven reliability**: Pattern tested and working in auth flows

**Alternatives considered:**
- Two endpoints (request + complete): Status polling requires overloading complete endpoint, breaks separation of concerns
- Single endpoint with streaming: Requires WebSocket or SSE, not supported by `hc` client

**Implementation:**
```typescript
// Payment endpoints (same pattern as auth)
POST   /api/payment/request         → { requestId, authorizeUrl?, dcApiRequest?, transactionId }
GET    /api/payment/status/:requestId → { status: "created" | "pending" | "authorized" | "rejected" | "error" | "expired", claims? }
POST   /api/payment/complete/:requestId → { transactionId, confirmedAt, verifiedIdentity, transaction }
```

On status `authorized`, server fetches normalized claims via Authorizer `GET /openid4/vp/v1_0/authorizations/{authorizationId}/credentials`.

Client reuses same polling and DC API components from auth-flows.

---

### Decision 5: Transaction Metadata Pass-Through

**Choice:** Include transaction details (recipient, amount, reference) in payment request creation, return synthetic transaction ID immediately.

**Why:**
- **Auditability**: Server logs transaction intent even if verification fails
- **Success page data**: Transaction ID and details available for display without additional lookup
- **Future-proof**: Enables transaction history or audit log later
- **Consistent ID**: Transaction ID remains stable across request/status/complete cycle

**Alternatives considered:**
- Client holds transaction data: Server can't log incomplete transactions, no audit trail
- Generate transaction ID on completion: Success page must query server for ID, extra roundtrip
- Use requestId as transaction ID: Couples Vidos authorization to transaction concept

**Implementation:**
```typescript
// POST /api/payment/request
{
  recipient: "John's Coffee Shop",
  amount: "45.00",
  reference: "Invoice #123"
}

// Response
{
  requestId: "uuid-1234",
  transactionId: "txn-5678",
  authorizeUrl: "https://authorizer.vidos.dev/..."
}

// Server stores in pendingPayments
{
  requestId: "uuid-1234",
  transactionId: "txn-5678",
  authId: "vidos-auth-id",
  mode: "direct_post",
  transaction: { recipient, amount, reference },
  createdAt: Date.now()
}
```

---

### Decision 6: Minimal PID Attributes for Payment

**Choice:** Request only `family_name`, `given_name`, and one identifier (`personal_administrative_number` or `document_number`) for payment confirmation.

**Why:**
- **Privacy**: Don't request more attributes than necessary for confirmation
- **Faster verification**: Fewer attributes = smaller credential presentation
- **Sufficient identity proof**: Name + identifier uniquely confirms user
- **Matches PRD**: Use Case 5 specifies these attributes

**Alternatives considered:**
- Full PID (all attributes): Privacy violation, slower, unnecessary
- Identifier only: Less human-readable confirmation on success page
- No attributes (just proof of wallet): Doesn't prove user's identity

**Implementation:**
```typescript
// server/src/routes/payment.ts
const authRequest = await vidosService.createAuthorizationRequest({
  mode: session.mode,
  attributes: [
    "family_name",
    "given_name",
    "personal_administrative_number",
    "document_number", // fallback if PAN not available
  ],
  purpose: "payment_confirmation",
});
```

---

### Decision 7: No Balance Update (Demo Only)

**Choice:** Transaction success page displays confirmation, but account balance on dashboard remains unchanged.

**Why:**
- **Explicit demo scope**: PRD marks balance updates as out-of-scope
- **Focus on verification**: Demo highlights Vidos authorization, not banking logic
- **Simpler implementation**: No need for account balances, ledger, or transaction persistence
- **Clear messaging**: Success page states "Demo mode - balance not affected"

**Alternatives considered:**
- Mock balance decrease: Requires client-side state or session storage, gets out of sync across tabs
- Persistent transactions: Requires database, transaction history UI, reconciliation logic

**Implementation:**
```tsx
// client/src/routes/_auth/send/success.tsx
<Card>
  <CardHeader>
    <CardTitle>Payment Confirmed</CardTitle>
    <CardDescription>
      Transaction authorized via EUDI Wallet
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        Demo mode: Your balance has not been updated. In production, €{amount} would be transferred to {recipient}.
      </AlertDescription>
    </Alert>
    {/* Transaction details */}
  </CardContent>
</Card>
```

---

### Decision 8: Polling and Timeout Reuse

**Choice:** Use identical polling strategy and timeout values as auth-flows (1s → 5s exponential backoff, 5min timeout).

**Why:**
- **Proven values**: Auth flows validated these timings work well
- **Code reuse**: Same polling hook/component with no changes
- **Consistent UX**: User expects same wait time as login flow

No new decisions needed - just import and reuse `useAuthPolling` hook.

---

## Component Structure

```
client/src/
  routes/
    _auth/
      send/
        index.tsx             # Payment form, templates sidebar, amount/reference inputs
        confirm.tsx           # Transaction summary, "Confirm with EUDI Wallet" button, verification flow
        success.tsx           # Success message, transaction details, back to dashboard button
  components/
    payment/
      recipient-templates.tsx # Pre-filled template cards (clickable)
      transaction-form.tsx    # Recipient/amount/reference form fields
      transaction-summary.tsx # Read-only transaction details for confirmation page
    auth/
      qr-code-display.tsx     # Reused from auth-flows
      dc-api-handler.tsx      # Reused from auth-flows
      polling-status.tsx      # Reused from auth-flows

server/src/
  routes/
    payment.ts                # POST /request, GET /status/:id, POST /complete/:id
  stores/
    pendingPayments.ts        # Maps requestId → { authId, mode, transaction, transactionId }
  services/
    vidos.ts                  # Reused, already supports createAuthorizationRequest

shared/src/
  api/
    payment.ts                # Schemas for payment endpoints
  types/
    payment.ts                # TransactionData, PaymentStatus types
```

## Data Flow

### Sequence: Payment with direct_post Mode

```
User                 Client                  Server                  Vidos API
  |                     |                       |                         |
  |--[Fill form]------->|                       |                         |
  |--[Click template]-->|                       |                         |
  |                     | [recipient auto-fill] |                         |
  |--[Continue]-------->|                       |                         |
  |                     |---navigate to confirm>|                         |
  |                     | [search params set]   |                         |
  |                     |                       |                         |
  |--[Confirm Payment]->|                       |                         |
  |                     |---POST /payment/req-->|                         |
  |                     | {recipient,amount,ref}| [get session mode]      |
  |                     |                       |---createAuthReq-------->|
  |                     |                       |   (mode from session)   |
  |                     |                       |<--{authId, url}---------|
  |                     |                       | [store in pending]      |
  |                     |                       | [generate txnId]        |
  |                     |<--{requestId, url,----|                         |
  |                     |     txnId}            |                         |
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
  |                     |<--{status:authorized}-|                         |
  |                     |                       |                         |
  |                     |---POST /complete/:id->|                         |
  |                     |                       | [fetch credentials +    |
  |                     |                       |  verify match session]  |
  |                     |<--{txnId, details}----|                         |
  |                     |                       |                         |
  |--[redirect success]>|                       |                         |
  |                     | [search params: txnId,|                         |
  |                     |  recipient, amount]   |                         |
```

### Sequence: Payment with dc_api Mode

```
User                 Client                  Server                  Vidos API
  |                     |                       |                         |
  |--[Fill & Confirm]-->|                       |                         |
  |                     |---POST /payment/req-->|                         |
  |                     |                       | [get session mode]      |
  |                     |                       |---createAuthReq-------->|
  |                     |                       |   (mode=dc_api)         |
  |                     |                       |<--{authId, dcApiReq}----|
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
  |                     |                       | [verify claims match    |
  |                     |                       |  session user]          |
  |                     |<--{txnId, details}----|                         |
  |                     |                       |                         |
  |--[redirect success]>|                       |                         |
```

## Shared Schemas

**shared/src/api/payment.ts:**
```typescript
import { z } from "zod";
import { extractedClaimsSchema } from "../types/auth";

// POST /api/payment/request
export const paymentRequestSchema = z.object({
  recipient: z.string().min(1).max(100),
  amount: z.string().regex(/^\d+\.\d{2}$/), // EUR format: "123.45"
  reference: z.string().max(200).optional(),
});

export const paymentRequestResponseSchema = z.object({
  requestId: z.string().uuid(),
  transactionId: z.string(), // e.g., "txn-20260211-001"
  authorizeUrl: z.string().url().optional(), // direct_post only
  dcApiRequest: z.unknown().optional(),      // dc_api only
});

// GET /api/payment/status/:requestId
export const paymentStatusResponseSchema = z.object({
  status: z.enum(["created", "pending", "authorized", "rejected", "error", "expired"]),
  claims: extractedClaimsSchema.optional(), // present when authorized
});

// POST /api/payment/complete/:requestId
export const paymentCompleteRequestSchema = z.object({
  dcResponse: z.unknown().optional(), // dc_api mode only
});

export const paymentCompleteResponseSchema = z.object({
  transactionId: z.string(),
  confirmedAt: z.string(), // ISO timestamp
  verifiedIdentity: z.object({
    name: z.string(), // "Given Family"
    identifier: z.string(), // PAN or document number
  }),
  transaction: z.object({
    recipient: z.string(),
    amount: z.string(),
    reference: z.string().optional(),
  }),
});

export const paymentErrorResponseSchema = z.object({
  error: z.string(),
});
```

**shared/src/types/payment.ts:**
```typescript
export type TransactionData = {
  recipient: string;
  amount: string; // EUR formatted
  reference?: string;
};

export type RecipientTemplate = {
  id: string;
  name: string;
  amount: string;
};
```

## Risks / Trade-offs

**[Risk]** User's session mode (direct_post/dc_api) may not work in current browser context  
**→ Mitigation:** Error message guides user to retry auth or use different device. Acceptable for demo.

**[Risk]** URL search params expose transaction details in browser history  
**→ Mitigation:** No sensitive data (account numbers, passwords) in params. Amount/recipient are acceptable. Session cookie still required for access.

**[Risk]** Hardcoded templates don't match user's actual payees  
**→ Mitigation:** Demo context makes fictional recipients acceptable. User can edit any field.

**[Risk]** No validation that recipient exists or amount is valid  
**→ Mitigation:** Explicit in demo scope. Success page notes "Demo mode - no actual transfer".

**[Risk]** Polling continues if user navigates away from confirmation page  
**→ Mitigation:** Reuse auth-flows polling cleanup (useEffect unmount cancels polling). Timeout ensures eventual stop.

**[Risk]** Transaction ID generation collision (if using simple counter)  
**→ Mitigation:** Use timestamp + random suffix (e.g., `txn-20260211-${crypto.randomUUID().slice(0,8)}`).

**[Risk]** Verified identity on completion doesn't match session user  
**→ Mitigation:** Server validates that PAN/document number from PID matches session user's identifier. Return 403 if mismatch.

**[Trade-off]** No transaction history = user can't review past payments  
**→ Benefit:** Simpler implementation, focuses demo on verification flow. Transaction history is out of scope.

**[Trade-off]** Reusing session mode = user can't try alternative mode for payment  
**→ Benefit:** Consistent UX, reduced complexity. User can sign out and re-auth with different mode to test.

**[Trade-off]** Search params vs POST for transaction data  
**→ Benefit:** Search params enable shareable URLs and browser navigation. Trade-off is history exposure (acceptable for demo).

## Migration Plan

**Prerequisites:**
- `auth-flows` change deployed and verified
- `core-infrastructure` change deployed
- User sessions include `presentationMode` field
- Vidos service supports payment authorization requests

**Deployment steps:**
1. Deploy shared schemas (`shared/src/api/payment.ts`, `shared/src/types/payment.ts`)
2. Deploy server payment routes (`server/src/routes/payment.ts`)
3. Add payment routes to server app (method-chained)
4. Deploy client components (`payment/` folder)
5. Deploy client routes (`_auth/send/` folder)
6. Verify server starts, routes registered correctly

**Rollback:**
- No database migrations, pure code rollback
- Remove payment routes from server
- Remove payment pages from client
- No impact on existing auth flows

**Verification:**
1. Sign in to DemoBank (establishes session with mode)
2. Navigate to `/send`, verify form renders with templates
3. Click template, verify recipient/amount auto-fill
4. Click "Continue", verify navigation to `/send/confirm` with search params
5. Click "Confirm with EUDI Wallet", verify QR or DC API based on session mode
6. Complete verification with wallet, verify polling or DC API response
7. Verify redirect to `/send/success` with transaction details
8. Verify dashboard balance unchanged (demo note visible)

**Monitoring:**
- Log all payment requests (recipient, amount, mode used)
- Track verification completion rate (started vs completed)
- Alert on high error rates in payment completion
- Monitor polling duration distribution (optimize backoff if needed)

## Open Questions

1. **Transaction ID format:** Timestamp-based or UUID?  
   **→ Use `txn-${Date.now()}-${crypto.randomUUID().slice(0,8)}` for readability + uniqueness**

2. **Identity mismatch handling:** What if authorized PID doesn't match session user?  
   **→ Return 403 "Identity verification failed - please sign in again"**

3. **Reference field validation:** Allow special characters or alphanumeric only?  
   **→ Allow all printable chars, max 200 length. Server escapes for logging**

4. **Template click behavior:** Replace all fields or just recipient?  
   **→ Replace recipient + amount. Let user decide on reference**

5. **Success page auto-redirect:** Should success page auto-redirect to dashboard after 5s?  
   **→ No, let user read transaction details. Provide explicit "Back to Dashboard" button**

6. **Polling cleanup on success:** Should status polling stop as soon as authorized, or wait for completion?  
   **→ Stop on authorized, immediately proceed to completion endpoint. Same as auth-flows**
