## 1. Shared Loan Schemas and Types

- [x] 1.1 Create `shared/src/types/loan.ts` with loan constants (LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS)
- [x] 1.2 Add loan type exports (LoanAmount, LoanPurpose, LoanTerm) derived from constants
- [x] 1.3 Add Zod schemas (loanAmountSchema, loanPurposeSchema, loanTermSchema) with enum validation
- [x] 1.4 Create `shared/src/api/loan.ts` with request/response schemas
- [x] 1.5 Add loanRequestSchema (mode, amount, purpose, term)
- [x] 1.6 Add loanRequestResponseSchema (requestId, authorizeUrl?, dcApiRequest?)
- [x] 1.7 Add loanStatusResponseSchema (status enum, claims?)
- [x] 1.8 Add loanCompleteRequestSchema (dcResponse?) and loanCompleteResponseSchema (loanRequestId, message)
- [x] 1.9 Update `shared/package.json` exports map to include `"./api/loan"` and `"./types/loan"`

## 2. Server Loan Endpoints

- [x] 2.1 Create `server/src/routes/loan.ts` with pendingRequests in-memory map
- [x] 2.2 Implement POST /api/loan/request endpoint with zValidator for loanRequestSchema
- [x] 2.3 Add session authentication check in loan request handler
- [x] 2.4 Call vidosService.createAuthorizationRequest with loan metadata (type, amount, purpose, term)
- [x] 2.5 Store pending request in map with authId, status "created", loan details
- [x] 2.6 Return loanRequestResponseSchema (requestId, authorizeUrl or dcApiRequest based on mode)
- [x] 2.7 Implement GET /api/loan/status/:requestId endpoint
- [x] 2.8 Retrieve pending request from map, return 404 if not found
- [x] 2.9 Poll Vidos API with vidosService.pollAuthorizationStatus using stored authId
- [x] 2.10 Return loanStatusResponseSchema with current status and claims (if authorized)
- [x] 2.11 Implement POST /api/loan/complete/:requestId endpoint with zValidator for loanCompleteRequestSchema
- [x] 2.12 Add session authentication check in complete handler
- [x] 2.13 Retrieve pending request, validate status is "authorized", return 400 if not
- [x] 2.14 Fetch verified credentials from Vidos API (direct_post) or process dcResponse (dc_api)
- [x] 2.15 Extract claims (familyName, givenName, personalAdministrativeNumber, documentNumber)
- [x] 2.16 Log loan application with claims and loan details to console
- [x] 2.17 Generate loanRequestId, return loanCompleteResponseSchema with success message
- [x] 2.18 Delete requestId from pendingRequests map after successful completion
- [x] 2.19 Update `server/src/index.ts` to method-chain loan routes on app (preserve hc types)

## 3. Loan Application Form with Inline Verification

- [x] 3.1 Create `client/src/routes/_auth/loan/index.tsx` route component
- [x] 3.2 Add state management for form fields (amount, purpose, term) with no defaults
- [x] 3.3 Add state for flow: "form" | "verifying" | "error" (initial: "form")
- [x] 3.4 Import LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS from shared/types/loan
- [x] 3.5 Build amount dropdown with shadcn Select component showing EUR values
- [x] 3.6 Build purpose dropdown with shadcn Select component showing purpose options
- [x] 3.7 Build term dropdown with shadcn Select component showing "X months" format
- [x] 3.8 Add form validation requiring all three fields before submit enabled
- [x] 3.9 Implement handleSubmit to retrieve stored mode from local storage
- [x] 3.10 Call hcWithType client.loan.request.$post with mode, amount, purpose, term
- [x] 3.11 Destructure requestId, authorizeUrl/dcApiRequest from response
- [x] 3.12 Set state to "verifying" to show inline verification UI
- [x] 3.13 Conditionally render QR code component (direct_post) or DC API trigger (dc_api)
- [x] 3.14 Start polling GET /api/loan/status/:requestId when in "verifying" state (direct_post mode)
- [x] 3.15 Stop polling when status changes to "authorized", "rejected", "expired", or "error"
- [x] 3.16 Call POST /api/loan/complete/:requestId when status is "authorized"
- [x] 3.17 Navigate to `/loan/success` on successful completion
- [x] 3.18 Handle timeout (5min) by setting state to "error" and showing "Try Again" button
- [x] 3.19 Handle rejection/error by setting state to "error" and showing error message with "Try Again"
- [x] 3.20 Implement "Try Again" handler to reset state back to "form"

## 4. Loan Success Page

- [x] 4.1 Create `client/src/routes/_auth/loan/success.tsx` route component
- [x] 4.2 Add heading "Application Submitted" using shadcn Typography
- [x] 4.3 Add message "We'll review your application and contact you within 2 business days"
- [x] 4.4 Add "Return to Dashboard" button using shadcn Button component
- [x] 4.5 Wire button onClick to navigate to `/dashboard` using TanStack Router
- [x] 4.6 Ensure no "Check Status" button or loan tracking UI is present
- [x] 4.7 Verify route is under `_auth` layout to require authentication

## 5. Manual Verification and Testing

- [x] 5.1 Run `bun run check-types` to verify no TypeScript errors
- [x] 5.2 Run `bun run dev` and navigate to `/loan` as authenticated user
- [x] 5.3 Verify all three dropdowns render with correct options (no defaults selected)
- [x] 5.4 Verify submit button is disabled until all fields are selected
- [x] 5.5 Submit form with EUR 25,000, Car, 24 months
- [x] 5.6 Verify inline "Verify Identity" UI displays (QR or DC API based on stored mode)
- [x] 5.7 Complete wallet verification and verify redirect to `/loan/success`
- [x] 5.8 Verify success page displays correct heading and message
- [x] 5.9 Click "Return to Dashboard" and verify navigation works
- [x] 5.10 Test with dc_api mode (if available) to verify DC API flow works
- [x] 5.11 Test timeout scenario by not completing verification for 5+ minutes
- [x] 5.12 Test "Try Again" button resets form correctly
- [x] 5.13 Verify unauthenticated users cannot access `/loan` or `/loan/success`
- [x] 5.14 Run `bun run lint` and `bun run format` to ensure code style compliance
