## Why

DemoBank needs PID-based signup and signin to replace traditional username/password flows, aligned with the PRD. This demonstrates Vidos Authorizer integration for privacy-preserving identification using PID credentials from an EUDI Wallet.

## What Changes

- Add PID-based signup flow that creates a user profile from verified PID claims
- Add PID-based signin flow that verifies minimal attributes and matches an existing user by identifier
- Support two presentation modes: OpenID4VP (QR code/deep link) and Digital Credentials API (browser wallet)
- Enable mode selection UI with browser feature detection and session persistence
- Create server endpoints for authorization request creation, status polling, and completion
- Integrate Vidos Authorizer for credential presentation requests and verification

## Capabilities

### New Capabilities

- `signup-request`: Server endpoint to create Vidos authorization request for new user registration, requesting PID attributes aligned to the PRD flow (family_name, given_name, birth_date, birth_place, nationality, resident_address or structured address fields, portrait optional, personal_administrative_number optional, document_number optional)
- `signup-verification`: Server endpoints to poll verification status and complete signup by creating a user and session from verified PID claims
- `signin-request`: Server endpoint to create Vidos authorization request for existing user login, requesting minimal PID attributes (personal_administrative_number preferred, document_number fallback, family_name, given_name)
- `signin-verification`: Server endpoints to poll verification status and complete signin by matching an existing user via identifier; return "No account found with this identity. Please sign up first." when no match
- `mode-selection`: Client UI component for selecting and persisting presentation mode (direct_post for QR/deep link vs dc_api for browser wallet), with direct_post as the default option
- `qr-code-display`: Client component to render QR codes for direct_post mode on desktop devices
- `wallet-deeplink`: Client handling for wallet deep links in direct_post mode on mobile devices
- `dc-api-flow`: Client integration with browser Digital Credentials API for dc_api presentation mode

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

**New Pages:**
- `/signup` - Registration page with PID flow and mode selection
- `/signin` - Login page with PID flow and mode selection

**New Server Endpoints:**
- `POST /api/signup/request` - Create signup authorization request
- `GET /api/signup/status/:requestId` - Poll signup verification status
- `POST /api/signup/complete/:requestId` - Complete signup and create user
- `POST /api/signin/request` - Create signin authorization request
- `GET /api/signin/status/:requestId` - Poll signin verification status
- `POST /api/signin/complete/:requestId` - Complete signin and authenticate user

**Dependencies:**
- Requires `core-infrastructure` change to be implemented first (Vidos service layer, environment config, in-memory stores)
- Vidos Authorizer service for PID verification
- Browser support for Digital Credentials API (optional, with fallback to direct_post)

**Shared Schemas:**
- New Zod schemas in `shared/src/api/` for all signup/signin endpoints
- Request/response types for mode selection and credential presentation

**Client Components:**
- shadcn/ui components for mode selection, QR code display, loading states
- TanStack Router routes for `/signup` and `/signin`

**Out of Scope:**
- Payment authorization flows
- Loan application flows  
- Dashboard implementation
- Landing page
