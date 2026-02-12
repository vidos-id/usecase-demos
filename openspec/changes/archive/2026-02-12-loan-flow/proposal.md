## Why

DemoBank users need to apply for loans with PID-based identity verification using their EUDI Wallet. This demonstrates Use Case 6 from the PRD - enabling secure, privacy-preserving loan applications verified through Vidos Authorizer integration.

## What Changes

- Add loan application form with pre-set loan amounts (EUR 5k/10k/25k/50k), purpose options, and term selection
- Integrate PID verification flow for loan applications using existing session mode (direct_post or dc_api)
- Create server endpoints to initiate loan verification requests and handle authorization status
- Add loan application success page with confirmation message ("We'll review your application and contact you within 2 business days")
- Reuse Vidos authorization pattern established in auth-flows (same attributes as payment verification: family_name, given_name, personal_administrative_number or document_number)

## Capabilities

### New Capabilities

- `loan-application-form`: Loan options selection UI - amount dropdown, purpose dropdown, term dropdown, submit triggers PID verification
- `loan-verification-flow`: PID identity verification trigger for loan applications - adapts to session's stored presentation mode (direct_post or dc_api)
- `loan-request-api`: Server endpoint POST /api/loan/request - creates Vidos authorization request with loan details, returns requestId and presentation URL
- `loan-status-api`: Server endpoints for authorization tracking - GET /api/loan/status/:requestId (direct_post polling) and POST /api/loan/complete/:requestId (dc_api callback)
- `loan-success-page`: Application submitted confirmation - displays "We'll review your application and contact you within 2 business days" message

### Modified Capabilities

<!-- No existing capability requirements change - we're adding new features using existing patterns -->

## Impact

**Client Changes:**
- New route `/loan` - loan application form component
- New route `/loan/success` - confirmation page
- New API client calls to loan endpoints (using hcWithType pattern)

**Server Changes:**
- Three new API endpoints in server/src/index.ts
- Loan verification logic reusing Vidos service patterns from payment flow
- Session mode determines presentation flow (direct_post vs dc_api)

**Shared Changes:**
- New Zod schemas in shared/src/api/ for loan request/response validation
- Loan data types (amount options, purpose, term)

**Dependencies:**
- Requires `auth-flows` change (session mode storage and retrieval)
- Requires `core-infrastructure` change (Vidos service integration)
- Uses same PID attributes as payment verification flow

**Out of Scope:**
- Actual loan processing or credit checks (backend business logic)
- Loan status tracking or approval workflow
- Integration with banking systems
