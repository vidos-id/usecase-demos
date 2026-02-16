## Why

DemoBank needs to demonstrate secure money transfers using PID-based identity confirmation via EUDI Wallet. This implements Use Case 5 from the PRD, showing how financial transactions can be authorized with verified identity attributes instead of traditional authentication methods, which is a key use case for the Vidos Authorizer integration.

## What Changes

- Add send money transaction form with pre-filled recipient templates
- Add transaction confirmation page with PID verification trigger ("Confirm with EUDI Wallet")
- Add transaction success page
- Implement server endpoints for payment authorization request creation
- Implement client-side payment authorization flow (polling for direct_post, completion for dc_api)
- Reuse session mode (direct_post/dc_api) stored during signup or signin
- Request PID attributes: family_name, given_name, personal_administrative_number or document_number

## Capabilities

### New Capabilities

- `payment-form`: Transaction entry form at /send route with recipient field (editable with pre-filled templates like "John's Coffee Shop - EUR 45.00"), amount field, and optional reference field
- `payment-confirmation`: Transaction summary page at /send/confirm showing details and "Confirm with EUDI Wallet" button to trigger PID verification
- `payment-request-api`: Server endpoint POST /api/payment/request that creates Vidos authorization request for identity confirmation using session's stored mode
- `payment-verification`: Client-side authorization flow handling - GET /api/payment/status/:requestId for polling (direct_post mode) and POST /api/payment/complete/:requestId for DC API response (dc_api mode)
- `payment-success`: Success page at /send/success showing transaction confirmation with details, then returning to dashboard (balance remains unchanged in demo)

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

**New Routes:**
- `/send` - Send money form (auth required)
- `/send/confirm` - Transaction confirmation (auth required)
- `/send/success` - Success page (auth required)

**New API Endpoints:**
- `POST /api/payment/request` - Create payment authorization request
- `GET /api/payment/status/:requestId` - Poll authorization status (direct_post)
- `POST /api/payment/complete/:requestId` - Complete with DC API (dc_api)

**Dependencies:**
- Requires auth-flows change (session management, mode storage)
- Requires core-infrastructure change (Vidos service, local storage)
- Shared Zod schemas for payment transaction data

**Code Areas:**
- `client/src/routes/send*.tsx` - New route components
- `server/src/index.ts` - New payment endpoints
- `shared/src/api/payment.ts` - Payment request/response schemas
- Reuses Vidos service patterns from auth-flows

**Out of Scope:**
- Actual money transfer logic
- Balance updates (demo shows static balance)
- Transaction history or persistence
- Multi-currency support beyond EUR display
