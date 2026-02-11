# Product Requirement Document: DemoBank PID Integration

## Overview

This PRD defines a demo banking web application showcasing Vidos Authorizer capabilities for PID-based identification, aligned with the EU Digital Identity Wallet "Using PID" use case.

The application simulates a banking service ("DemoBank") where users can sign up, log in, and perform authenticated actions (transactions, loan applications) using their Person Identification Data (PID) credential from an EUDI Wallet instead of traditional manual forms.

This demo is for investor meetings and technical evaluations, demonstrating how Vidos Authorizer integrates with real-world applications.

## Goals

- Demonstrate PID-based user registration with auto-populated profile from credential
- Demonstrate PID-based login for returning users
- Demonstrate PID-based transaction confirmation (elevated access/MFA equivalent)
- Demonstrate PID-based loan application confirmation
- Show visual comparison: traditional manual flow steps vs streamlined PID flow
- Integration with Vidos Authorizer API via QR code, deep link, and Digital Credentials API
- Clean, professional banking UI suitable for investor presentation
- Self-explanatory flows requiring minimal verbal explanation
- Work both in guided sales demos and self-service exploration

## Non-Goals

- PID issuance (out of scope - users already have PID in wallet)
- Production-grade security (proper JWT sessions, secure token storage)
- Real banking functionality (actual money transfer, persistent accounts)
- Supporting other credential types beyond PID (mDL, etc.)
- Multiple language/i18n support
- Mobile-native app (web only)
- Cross-session data persistence (ephemeral storage only)

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
- Uses Vidos Authorizer API (`/openid4/vp/v1_0/authorizations`) for credential requests
- Session storage is ephemeral (in-memory on server, cleared on restart)
- Must support three presentation modes:
  1. QR code scanning (cross-device)
  2. Deep link / same-device redirect
  3. Digital Credentials API (browser-native, where supported)
- Polling-based result retrieval from Authorizer API

## Key Use Cases

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
4. System creates authorization request via Vidos Authorizer API requesting:
   - `family_name` (mandatory)
   - `given_name` (mandatory)
   - `birth_date` (mandatory)
   - `nationality` (mandatory)
   - `resident_address` or structured address fields (`resident_street`, `resident_city`, `resident_postal_code`, `resident_country`)
   - `portrait` (optional - for profile photo)
   - `personal_administrative_number` (optional - for unique ID)
   - `document_number` (optional - backup identifier)
5. QR code / deep link / DC API presented to user
6. User scans with wallet, reviews requested attributes, approves
7. Wallet submits presentation to Vidos Authorizer
8. Client polls for result
9. On success: Extract claims, create local user session, redirect to profile page showing populated data
10. Profile page displays: name, photo (if provided), address, with "Welcome to DemoBank" message

### 3. Sign In with PID

Returning user authenticates using PID credential.

**Flow:**
1. User clicks "Sign In"
2. Login page shows two paths:
   - **Traditional flow** (disabled): Username/password fields - marked as "Not available in demo"
   - **PID flow** (enabled): "Sign in with EUDI Wallet" button
3. User clicks PID option
4. System creates authorization request requesting minimal attributes:
   - `personal_administrative_number` (preferred identifier)
   - `document_number` (fallback identifier)
   - `family_name` (for verification/display)
   - `given_name` (for verification/display)
5. QR code / deep link / DC API presented
6. User approves in wallet
7. On success: Match user by `personal_administrative_number` or `document_number` against stored users
8. If match found: Create session, redirect to dashboard
9. If no match: Show error "No account found with this identity. Please sign up first."

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
  - "Sign Out"

### 5. Send Money with PID Confirmation

User initiates a transaction that requires identity confirmation.

**Flow:**
1. User clicks "Send Money" from dashboard
2. Transaction form shows:
   - Recipient field (editable, pre-filled templates on side like "John's Coffee Shop", "Maria Garcia", etc.)
   - Amount field (editable)
   - Reference field (optional)
3. User fills/edits form, clicks "Continue"
4. Confirmation page shows transaction summary
5. "Confirm with EUDI Wallet" button
6. System creates authorization request (minimal attributes for identity confirmation):
   - `family_name`
   - `given_name`
   - `personal_administrative_number` or `document_number`
7. User approves in wallet
8. On success: Show "Transaction Successful" confirmation with details
9. Return to dashboard (balance unchanged - it's a demo)

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
5. System creates authorization request (same as transaction confirmation)
6. User approves in wallet
7. On success: Show "Application Submitted" confirmation
8. Message: "We'll review your application and contact you within 2 business days."
9. Return to dashboard

## Pages Summary

| Page | Route | Auth Required |
|------|-------|---------------|
| Landing/Home | `/` | No |
| Sign Up | `/signup` | No |
| Sign In | `/signin` | No |
| Dashboard | `/dashboard` | Yes |
| Profile | `/profile` | Yes |
| Send Money | `/send` | Yes |
| Apply for Loan | `/loan` | Yes |

## API Endpoints (Server)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request` | POST | Create Vidos authorization request |
| `/api/auth/status/:id` | GET | Poll authorization status |
| `/api/auth/complete` | POST | Complete auth flow, create session |
| `/api/users/me` | GET | Get current user profile |
| `/api/session` | GET | Check session status |
| `/api/session` | DELETE | Log out |

## Technical Integration with Vidos Authorizer

### Creating Authorization Request

```
POST /openid4/vp/v1_0/authorizations
```

Request body includes:
- Presentation definition specifying required PID attributes
- Response mode (`direct_post.jwt` or `dc_api.jwt`)
- Nonce for binding

Response provides:
- Authorization URL (for QR code / deep link)
- Authorization ID (for polling)

### Polling for Result

Client polls `/api/auth/status/:id` which internally checks Vidos Authorizer for submission status.

### Credential Formats

Support both:
- SD-JWT VC format (claim names: `family_name`, `given_name`, `birthdate`, etc.)
- ISO/IEC 18013-5 mdoc format (same attribute names)

The application extracts claims regardless of format, using the Vidos Authorizer's normalized credential response.

## UI/UX Requirements

- Clean, modern banking aesthetic (think N26, Revolut)
- Responsive design (works on presenter's laptop and large screen)
- Clear visual distinction between "traditional" (disabled) and "PID" (enabled) flows
- Loading states during wallet interaction
- Error states with clear messaging
- QR code large enough to scan from reasonable distance
- Deep link button for same-device testing

## Success Criteria

1. Complete sign-up flow with PID in under 30 seconds (excluding wallet interaction time)
2. Complete sign-in flow with PID in under 15 seconds
3. Transaction/loan confirmation flow completes without errors
4. Demo can run standalone without verbal explanation
5. No server errors during typical demo flow
6. Works with EUDI reference wallet implementation

## Out of Scope for V1

- Password-based fallback authentication
- Email verification
- Real transaction processing
- Persistent database storage
- Admin panel
- Analytics/logging dashboard
- Multiple account support per user
- Account settings/preferences

## Research

### User Research

N/A - This is an internal demo application. Requirements derived from:
- EU Commission PID use case manual
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

## References

- [EU PID Use Case Manual](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/930451131/PID+Identification+Manual)
- [PID Rulebook (ARF Annex 3.01)](https://eudi.dev/2.4.0/annexes/annex-3/annex-3.01-pid-rulebook/)
- [OpenID4VP Specification](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- Vidos Authorizer API (see `server/authorizer.service.yaml`)
