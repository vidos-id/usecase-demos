# Product Requirement Document: DemoBank PID Integration

## Overview

This PRD defines a demo banking web application showcasing Vidos Authorizer capabilities for PID-based identification, aligned with the EU Digital Identity Wallet "Using PID" use case.

The application simulates a banking service ("DemoBank") where users can sign up, log in, and perform authenticated actions (transactions, loan applications) using their Person Identification Data (PID) credential from an EUDI Wallet instead of traditional manual forms.

This demo is for investor meetings and technical evaluations, demonstrating how Vidos Authorizer integrates with real-world applications.

**Note on Payment Authentication:** The EU EUDI Wallet ecosystem defines a separate "Payment Authentication" use case involving SCA (Strong Customer Authentication) attestations issued by Payment Service Providers. Our demo focuses on PID-based identity verification and confirmation for sensitive actions, not full PSD2-compliant payment authentication which would require additional SCA attestation infrastructure.

## Goals

- Demonstrate PID-based user registration with auto-populated profile from credential
- Demonstrate PID-based login for returning users
- Demonstrate PID-based identity confirmation for transactions (elevated access)
- Demonstrate PID-based identity confirmation for loan applications
- Show visual comparison: traditional manual flow steps vs streamlined PID flow
- Integration with Vidos Authorizer API via QR code, deep link, and Digital Credentials API
- Clean, professional banking UI suitable for investor presentation
- Responsive design supporting desktop and mobile devices
- Self-explanatory flows requiring minimal verbal explanation
- Work both in guided sales demos and self-service exploration
- Visual journey progress indicator showing user's position in the flow

## Non-Goals

- PID issuance (out of scope - users already have PID in wallet)
- Production-grade security (proper JWT sessions, secure token storage)
- Real banking functionality (actual money transfer, persistent accounts)
- Full PSD2 SCA payment authentication (requires SCA attestations from PSP)
- Supporting other credential types beyond PID (mDL, etc.)
- Multiple language/i18n support
- Mobile-native app (web only, but mobile-responsive)
- Cross-server-restart data persistence (in-memory only)

## Audience

**Primary:** Investors and potential enterprise customers viewing the demo during sales/investor meetings. They want to understand how Vidos Authorizer integrates with real-world applications and the value proposition of PID-based identification.

**Secondary:** Technical evaluators (CTOs, architects) assessing Vidos capabilities for their own implementations.

The demo must be visually polished and self-explanatory, working both when guided by a Vidos sales representative and when explored independently.

## Existing Solutions and Issues

Current identity verification in banking typically involves:

- **Manual form entry**: User types personal details, prone to errors and tedious
- **Document upload + selfie**: User uploads ID photos and takes selfie video for liveness check. Multiple steps, high friction, privacy concerns about storing document images
- **Traditional eID schemes**: Fragmented across EU, different implementations per country

PID-based identification addresses these by:

- Single credential presentation replaces multi-step verification
- User controls exactly which attributes are shared (selective disclosure)
- Cryptographically verified, high assurance level
- Cross-border interoperability across EU member states

## Assumptions

- Users have access to an EUDI-compatible wallet with a valid PID credential
- Demo will be shown using the Vidos development/staging Authorizer instance
- Presenters have a mobile device with wallet app for live demonstrations
- Modern browser with JavaScript enabled (Chrome, Safari, Firefox)
- For Digital Credentials API: Chrome with experimental flags or supported browser

## Constraints

- Built on existing Bun + Turbo monorepo (React/Vite client, Hono server)
- Server consumes Vidos Authorizer API; client consumes server API (layered architecture)
- Vidos Authorizer endpoint and API key configured via environment variables
- Session storage is ephemeral (in-memory on server, cleared on restart)
- Session ID generated per sign-in/sign-up, used for subsequent requests
- Two presentation modes (user selects at first auth, persisted for session):
  1. **OpenID4VP (direct_post)**: QR code / deep link flow - wallet submits to Vidos directly
  2. **Digital Credentials API (dc_api)**: Browser-native flow - client receives response, forwards to server
- Mode selection happens at signup/signin, reused for remainder of session
- Responsive design: mobile-first with desktop enhancements

## Architecture

```
┌─────────────┐     polls      ┌─────────────┐     polls      ┌──────────────────┐
│   Client    │ ─────────────► │   Server    │ ─────────────► │ Vidos Authorizer │
│  (React)    │                │   (Hono)    │                │      API         │
└─────────────┘                └─────────────┘                └──────────────────┘
      │                              │
      │ session ID                   │ in-memory store
      │ (cookie/header)              │ - users
      ▼                              │ - sessions
  Browser                            │ - pending auth requests
  Storage                            │ - presentation mode preference
                                     ▼
                               Server Memory
```

### Data Flow: OpenID4VP Mode (direct_post)

1. Client initiates action (signup/signin/payment/loan)
2. Server creates authorization request via Vidos API with `response_mode: direct_post.jwt`
3. Server returns `{ requestId, authorizeUrl }` to client
4. Client displays QR code with `authorizeUrl` (desktop) or opens as deep link (mobile)
5. User scans/clicks, wallet opens, approves
6. Wallet submits presentation directly to Vidos Authorizer
7. Client polls server `GET /api/{flow}/status/:requestId`
8. Server polls Vidos for result
9. On success: server extracts claims, creates/updates user, returns session
10. Client proceeds to next step

### Data Flow: Digital Credentials API Mode (dc_api)

1. Client initiates action (signup/signin/payment/loan)
2. Server creates authorization request via Vidos API with `response_mode: dc_api.jwt`
3. Server returns `{ requestId, digitalCredentialGetRequest, responseUrl }` to client
4. Client calls browser DC API with `digitalCredentialGetRequest`
5. Browser triggers wallet, user approves
6. Browser DC API returns response to client
7. Client sends response to server `POST /api/{flow}/complete/:requestId`
8. Server forwards response to Vidos `responseUrl`
9. Vidos validates, server extracts claims, creates/updates user
10. Server returns session to client
11. Client proceeds to next step

**Note:** In DC API mode there is no QR code - only the browser-native credential request flow.

## Environment Variables

```bash
# Server
VIDOS_AUTHORIZER_URL=https://authorizer.vidos.dev  # Vidos Authorizer base URL
VIDOS_API_KEY=xxx                                   # API key for Vidos
```

## Key Use Cases

### User Journey Progress Indicator

A visual progress indicator shall be displayed throughout the user journey:

```
○──────────●──────────○──────────○
Intro    Authenticate   Action    Finish
         (current)    (payment/
                       loan)
```

- Shows previous steps (completed), current step (highlighted), and upcoming steps
- Branches for payment vs loan paths after authentication
- Adapts based on user's chosen flow (signup vs signin, payment vs loan)

### 1. Landing Page with Context

Brief intro page explaining what DemoBank is and how PID works, with clear CTA to proceed.

**Flow:**

1. User lands on DemoBank homepage
2. Brief explainer about EUDI Wallet and PID (1-2 sentences)
3. Two primary actions: "Create Account" and "Sign In"

### 2. Sign Up with PID

User creates a new bank account using PID credential instead of manual form entry.

**Flow:**

1. User clicks "Create Account"
2. Registration page shows two paths:
   - **Traditional flow** (disabled): Lists required steps (enter details, upload documents, take selfie, wait for verification) - marked as "Not available in demo"
   - **PID flow** (enabled): "Sign up with EUDI Wallet" button
3. User clicks PID option
4. **Mode selection**: User chooses presentation mode (toggle/radio):
   - "QR Code / Deep Link" (OpenID4VP direct_post) - default
   - "Browser Wallet" (Digital Credentials API) - if browser supports
5. Client calls `POST /api/signup/request` with `{ mode: "direct_post" | "dc_api" }`
6. Server creates Vidos authorization request for:
   - `family_name` (mandatory)
   - `given_name` (mandatory)
   - `birth_date` (mandatory)
   - `nationality` (mandatory)
   - `resident_address` or structured address fields
   - `portrait` (optional - for profile photo)
   - `personal_administrative_number` (optional - for unique ID)
   - `document_number` (optional - backup identifier)
7. **If direct_post mode:**
   - Server returns `{ requestId, authorizeUrl }`
   - Client displays QR code (desktop) or "Open Wallet" button (mobile) with `authorizeUrl`
   - User scans/clicks, wallet submits to Vidos
   - Client polls `GET /api/signup/status/:requestId`
8. **If dc_api mode:**
   - Server returns `{ requestId, digitalCredentialGetRequest }`
   - Client calls browser DC API
   - On response: Client calls `POST /api/signup/complete/:requestId` with DC API response
   - Server forwards to Vidos `responseUrl`
9. On success: Server creates user + session, stores mode preference
10. Server returns `{ sessionId, user, mode }`
11. Client stores sessionId + mode, redirects to profile page
12. Profile page displays: name, photo (if provided), address, with "Welcome to DemoBank" message

### 3. Sign In with PID

Returning user authenticates using PID credential.

**Flow:**

1. User clicks "Sign In"
2. Login page shows two paths:
   - **Traditional flow** (disabled): Username/password fields - marked as "Not available in demo"
   - **PID flow** (enabled): "Sign in with EUDI Wallet" button
3. User clicks PID option
4. **Mode selection**: User chooses presentation mode (same as signup)
5. Client calls `POST /api/signin/request` with `{ mode: "direct_post" | "dc_api" }`
6. Server creates Vidos authorization request for minimal attributes:
   - `personal_administrative_number` (preferred identifier)
   - `document_number` (fallback identifier)
   - `family_name` (for verification/display)
   - `given_name` (for verification/display)
7. Flow proceeds per selected mode (same as signup)
8. On success: Server matches user by identifier, creates session, stores mode preference
9. If match found: Returns `{ sessionId, user, mode }`, redirect to dashboard
10. If no match: Returns error "No account found with this identity. Please sign up first."

### 4. Dashboard with Account Overview

Logged-in user sees their account status and available actions.

**Content:**

- Welcome message with user's name
- Fake account balance (e.g., "EUR 12,450.00")
- Transaction history (2-3 fake recent transactions)
- Action buttons:
  - "Send Money" (requires PID confirmation)
  - "Apply for Loan" (requires PID confirmation)
  - "View Profile"
- Account menu (dropdown or sidebar):
  - "Sign Out" - destroys current session only
  - "Reset All Demo Data" - purges all users and sessions (for demo reset)

### 5. Send Money with PID Confirmation

User initiates a transaction that requires identity confirmation.

**Flow:**

1. User clicks "Send Money" from dashboard
2. Transaction form shows:
   - Recipient field (editable, with pre-filled templates on side: "John's Coffee Shop - EUR 45.00", "Maria Garcia - EUR 200.00", etc.)
   - Amount field (editable)
   - Reference field (optional)
3. User fills/edits form, clicks "Continue"
4. Confirmation page shows transaction summary
5. "Confirm with EUDI Wallet" button
6. Client calls `POST /api/payment/request` with transaction details (uses session's stored mode)
7. Server creates Vidos authorization request for identity confirmation:
   - `family_name`
   - `given_name`
   - `personal_administrative_number` or `document_number`
8. Flow proceeds per session's mode (direct_post or dc_api)
9. On success: Show "Transaction Successful" confirmation with details
10. Return to dashboard (balance unchanged - it's a demo)

### 6. Apply for Loan with PID Confirmation

User applies for a loan, requiring identity verification.

**Flow:**

1. User clicks "Apply for Loan" from dashboard
2. Loan application form shows:
   - Loan amount dropdown (pre-set options: EUR 5,000 / 10,000 / 25,000 / 50,000)
   - Purpose dropdown (Car, Home Improvement, Education, Other)
   - Term dropdown (12 / 24 / 36 / 48 months)
3. User selects options, clicks "Submit Application"
4. "Verify Identity with EUDI Wallet" prompt
5. Client calls `POST /api/loan/request` with loan details (uses session's stored mode)
6. Server creates Vidos authorization request (same attributes as payment)
7. Flow proceeds per session's mode (direct_post or dc_api)
8. On success: Show "Application Submitted" confirmation
9. Message: "We'll review your application and contact you within 2 business days."
10. Return to dashboard

### 7. Sign Out and Reset Demo Data

User actions for session management and demo reset.

**Sign Out:**

1. User clicks "Sign Out" from account menu
2. Client calls `DELETE /api/session`
3. Server destroys current session only
4. Client clears local session, redirects to landing page

**Reset All Demo Data:**

1. User clicks "Reset All Demo Data" from account menu
2. Confirmation dialog: "This will remove all registered users and sessions. Continue?"
3. On confirm: Client calls `DELETE /api/admin/reset`
4. Server clears ALL in-memory users and sessions
5. Client clears local session, redirects to landing page
6. Confirmation message: "Demo data has been reset"

## Pages Summary

| Page               | Route           | Auth Required | Progress Step |
| ------------------ | --------------- | ------------- | ------------- |
| Landing/Home       | `/`             | No            | Intro         |
| Sign Up            | `/signup`       | No            | Authenticate  |
| Sign In            | `/signin`       | No            | Authenticate  |
| Dashboard          | `/dashboard`    | Yes           | -             |
| Profile            | `/profile`      | Yes           | -             |
| Send Money         | `/send`         | Yes           | Action        |
| Send Money Confirm | `/send/confirm` | Yes           | Action        |
| Apply for Loan     | `/loan`         | Yes           | Action        |
| Success (Payment)  | `/send/success` | Yes           | Finish        |
| Success (Loan)     | `/loan/success` | Yes           | Finish        |

## API Endpoints (Server)

| Endpoint                                | Method | Purpose                                         |
| --------------------------------------- | ------ | ----------------------------------------------- |
| `POST /api/signup/request`              | POST   | Initiate signup, create Vidos auth request      |
| `GET /api/signup/status/:requestId`     | GET    | Poll signup authorization status (direct_post)  |
| `POST /api/signup/complete/:requestId`  | POST   | Complete signup with DC API response (dc_api)   |
| `POST /api/signin/request`              | POST   | Initiate signin, create Vidos auth request      |
| `GET /api/signin/status/:requestId`     | GET    | Poll signin authorization status (direct_post)  |
| `POST /api/signin/complete/:requestId`  | POST   | Complete signin with DC API response (dc_api)   |
| `POST /api/payment/request`             | POST   | Initiate payment confirmation auth request      |
| `GET /api/payment/status/:requestId`    | GET    | Poll payment authorization status (direct_post) |
| `POST /api/payment/complete/:requestId` | POST   | Complete payment with DC API response (dc_api)  |
| `POST /api/loan/request`                | POST   | Initiate loan confirmation auth request         |
| `GET /api/loan/status/:requestId`       | GET    | Poll loan authorization status (direct_post)    |
| `POST /api/loan/complete/:requestId`    | POST   | Complete loan with DC API response (dc_api)     |
| `GET /api/session`                      | GET    | Check current session status + mode             |
| `DELETE /api/session`                   | DELETE | Sign out (destroy current session only)         |
| `GET /api/users/me`                     | GET    | Get current user profile                        |
| `DELETE /api/admin/reset`               | DELETE | Purge ALL users and sessions                    |

## Server In-Memory Data Structures

```typescript
// User store
interface User {
  id: string; // UUID
  identifier: string; // personal_administrative_number or document_number
  familyName: string;
  givenName: string;
  birthDate: string;
  nationality: string;
  address?: string;
  portrait?: string; // base64 or data URL
  createdAt: Date;
}

// Session store
interface Session {
  id: string; // UUID, sent to client
  userId: string;
  mode: "direct_post" | "dc_api"; // Presentation mode for this session
  createdAt: Date;
  expiresAt: Date;
}

// Pending authorization requests
interface PendingAuthRequest {
  id: string; // Our internal ID
  vidosAuthorizationId: string; // Vidos authorization ID
  type: "signup" | "signin" | "payment" | "loan";
  mode: "direct_post" | "dc_api"; // Presentation mode
  status: "pending" | "completed" | "failed" | "expired";
  responseUrl?: string; // For dc_api mode - where to forward response
  metadata?: Record<string, unknown>; // Transaction/loan details
  createdAt: Date;
  completedAt?: Date;
  result?: {
    claims: Record<string, unknown>;
    sessionId?: string;
    error?: string;
  };
}
```

## Technical Integration with Vidos Authorizer

### Creating Authorization Request

Server calls Vidos Authorizer:

```
POST {VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/authorizations
Authorization: Bearer {VIDOS_API_KEY}
```

Request body includes:

- Presentation definition specifying required PID attributes
- Response mode (`direct_post.jwt` or `dc_api.jwt`)
- Nonce for binding

Response provides:

- `authorizeUrl` - Single URL for QR code / deep link (direct_post mode)
- `digitalCredentialGetRequest` - Request object for DC API (dc_api mode)
- `responseUrl` - Where to forward DC API response (dc_api mode)
- Authorization ID (for polling in direct_post mode)

### Result Retrieval

**direct_post mode:**

- Server polls Vidos Authorizer for authorization status
- Wallet submits directly to Vidos, Vidos processes and stores result
- Server retrieves credentials from Vidos when ready

**dc_api mode:**

- Client receives credentials directly from browser DC API
- Client sends credentials to server via `/complete/:requestId` endpoint
- Server forwards credentials to Vidos `responseUrl` for validation
- Vidos validates and returns processed credentials to server

### Credential Formats

Support both:

- SD-JWT VC format (claim names: `family_name`, `given_name`, `birthdate`, etc.)
- ISO/IEC 18013-5 mdoc format (same attribute names)

The application extracts claims regardless of format, using the Vidos Authorizer's normalized credential response.

## UI/UX Requirements

### General

- Clean, modern banking aesthetic (think N26, Revolut)
- Responsive design: mobile-first, works on all screen sizes
- Progress indicator visible throughout journey
- Clear visual distinction between "traditional" (disabled) and "PID" (enabled) flows
- Loading states during wallet interaction
- Error states with clear messaging

### Presentation Mode Selection

At signup/signin, user selects presentation mode:

- **"QR Code / Deep Link"** (direct_post) - Default option
  - Desktop: Shows QR code, with "Open on this device" link below
  - Mobile: Shows "Open Wallet" button
- **"Browser Wallet"** (dc_api) - If browser supports Digital Credentials API
  - No QR code shown
  - Single "Connect Wallet" button triggers browser DC API
  - Browser feature detection hides option if unsupported

Selected mode is stored in session and reused for all subsequent authentications (payment, loan).

### Desktop (direct_post mode)

- QR code large enough to scan from reasonable distance (~200px minimum)
- "Open on this device" link below QR
- Side-by-side layouts where appropriate

### Mobile (direct_post mode)

- "Open Wallet" button prominent and touch-friendly
- Single-column layouts
- Touch-friendly form inputs

### DC API mode (any device)

- Single "Connect Wallet" button
- Loading state while browser prompts user
- No QR code displayed

## Success Criteria

1. Complete sign-up flow with PID in under 30 seconds (excluding wallet interaction time)
2. Complete sign-in flow with PID in under 15 seconds
3. Transaction/loan confirmation flow completes without errors
4. Demo can run standalone without verbal explanation
5. No server errors during typical demo flow
6. Works with EUDI reference wallet implementation
7. Responsive UI works on iPhone SE through 27" monitor
8. Reset function fully clears all demo state

## Out of Scope for V1

- Password-based fallback authentication
- Email verification
- Real transaction processing
- Persistent database storage
- Admin panel (beyond reset)
- Analytics/logging dashboard
- Multiple account support per user
- Account settings/preferences
- True PSD2 SCA payment authentication

## Research

### User Research

N/A - This is an internal demo application. Requirements derived from:

- EU Commission PID use case manual
- EU Commission Payment Authentication use case manual
- Conversation with Rob (transcript Feb 11)
- Ping Identity's BX Finance demo as reference

### Technical Research

**PID Attributes (from ARF PID Rulebook):**

Mandatory attributes:

- `family_name` - Current surname(s)
- `given_name` - Current first name(s)
- `birth_date` - Date of birth (YYYY-MM-DD)
- `birth_place` - Country/region/locality of birth
- `nationality` - Alpha-2 country code(s)

Optional attributes used in this demo:

- `resident_address` / structured address fields
- `portrait` - Facial image (JPEG, base64 in SD-JWT)
- `personal_administrative_number` - Unique national ID
- `document_number` - Document reference number

**Vidos Authorizer Integration:**

- OpenID4VP protocol
- Supports `direct_post.jwt` and `dc_api.jwt` response modes
- Presentation definition format for requesting specific claims
- Polling-based result retrieval

**Payment Authentication Note:**

The EU Payment Authentication use case (for PSD2 SCA compliance) requires:

1. PSP to issue SCA Attestations to user's wallet
2. User presents SCA Attestations for payment authorization
3. Integration with payment infrastructure (SEPA, card networks)

Our demo uses PID for identity confirmation, which is conceptually different - it's "elevated access" verification rather than SCA payment authentication. Full payment authentication support would be a future enhancement requiring SCA attestation issuance capabilities.

## References

- [EU PID Use Case Manual](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/930451131/PID+Identification+Manual)
- [EU Payment Authentication Use Case Manual](./11_Use%20Case_Manual_Payment%20Authentication.pdf)
- [PID Rulebook (ARF Annex 3.01)](https://eudi.dev/2.4.0/annexes/annex-3/annex-3.01-pid-rulebook/)
- [OpenID4VP Specification](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- Vidos Authorizer API (see `server/authorizer.service.yaml`)
