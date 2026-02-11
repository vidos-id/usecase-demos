## 1. Shared Loan Schemas and Types

- [ ] 1.1 Create `shared/src/types/loan.ts` with loan constants (LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS)
- [ ] 1.2 Add loan type exports (LoanAmount, LoanPurpose, LoanTerm) derived from constants
- [ ] 1.3 Add Zod schemas (loanAmountSchema, loanPurposeSchema, loanTermSchema) with enum validation
- [ ] 1.4 Create `shared/src/api/loan.ts` with request/response schemas
- [ ] 1.5 Add loanRequestSchema (mode, amount, purpose, term)
- [ ] 1.6 Add loanRequestResponseSchema (requestId, authorizeUrl?, dcApiRequest?)
- [ ] 1.7 Add loanStatusResponseSchema (status enum, claims?)
- [ ] 1.8 Add loanCompleteRequestSchema (dcResponse?) and loanCompleteResponseSchema (loanRequestId, message)
- [ ] 1.9 Update `shared/package.json` exports map to include `"./api/loan"` and `"./types/loan"`

## 2. Server Loan Endpoints

- [ ] 2.1 Create `server/src/routes/loan.ts` with pendingRequests in-memory map
- [ ] 2.2 Implement POST /api/loan/request endpoint with zValidator for loanRequestSchema
- [ ] 2.3 Add session authentication check in loan request handler
- [ ] 2.4 Call vidosService.createAuthorizationRequest with loan metadata (type, amount, purpose, term)
- [ ] 2.5 Store pending request in map with authId, status "created", loan details
- [ ] 2.6 Return loanRequestResponseSchema (requestId, authorizeUrl or dcApiRequest based on mode)
- [ ] 2.7 Implement GET /api/loan/status/:requestId endpoint
- [ ] 2.8 Retrieve pending request from map, return 404 if not found
- [ ] 2.9 Poll Vidos API with vidosService.pollAuthorizationStatus using stored authId
- [ ] 2.10 Return loanStatusResponseSchema with current status and claims (if authorized)
- [ ] 2.11 Implement POST /api/loan/complete/:requestId endpoint with zValidator for loanCompleteRequestSchema
- [ ] 2.12 Add session authentication check in complete handler
- [ ] 2.13 Retrieve pending request, validate status is "authorized", return 400 if not
- [ ] 2.14 Fetch verified credentials from Vidos API (direct_post) or process dcResponse (dc_api)
- [ ] 2.15 Extract claims (familyName, givenName, personalAdministrativeNumber, documentNumber)
- [ ] 2.16 Log loan application with claims and loan details to console
- [ ] 2.17 Generate loanRequestId, return loanCompleteResponseSchema with success message
- [ ] 2.18 Delete requestId from pendingRequests map after successful completion
- [ ] 2.19 Update `server/src/index.ts` to method-chain loan routes on app (preserve hc types)

## 3. Loan Application Form with Inline Verification

- [ ] 3.1 Create `client/src/routes/_auth/loan/index.tsx` route component
- [ ] 3.2 Add state management for form fields (amount, purpose, term) with no defaults
- [ ] 3.3 Add state for flow: "form" | "verifying" | "error" (initial: "form")
- [ ] 3.4 Import LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS from shared/types/loan
- [ ] 3.5 Build amount dropdown with shadcn Select component showing EUR values
- [ ] 3.6 Build purpose dropdown with shadcn Select component showing purpose options
- [ ] 3.7 Build term dropdown with shadcn Select component showing "X months" format
- [ ] 3.8 Add form validation requiring all three fields before submit enabled
- [ ] 3.9 Implement handleSubmit to retrieve stored mode from session storage
- [ ] 3.10 Call hcWithType client.loan.request.$post with mode, amount, purpose, term
- [ ] 3.11 Destructure requestId, authorizeUrl/dcApiRequest from response
- [ ] 3.12 Set state to "verifying" to show inline verification UI
- [ ] 3.13 Conditionally render QR code component (direct_post) or DC API trigger (dc_api)
- [ ] 3.14 Start polling GET /api/loan/status/:requestId when in "verifying" state (direct_post mode)
- [ ] 3.15 Stop polling when status changes to "authorized", "rejected", "expired", or "error"
- [ ] 3.16 Call POST /api/loan/complete/:requestId when status is "authorized"
- [ ] 3.17 Navigate to `/loan/success` on successful completion
- [ ] 3.18 Handle timeout (5min) by setting state to "error" and showing "Try Again" button
- [ ] 3.19 Handle rejection/error by setting state to "error" and showing error message with "Try Again"
- [ ] 3.20 Implement "Try Again" handler to reset state back to "form"

## 4. Loan Success Page

- [ ] 4.1 Create `client/src/routes/_auth/loan/success.tsx` route component
- [ ] 4.2 Add heading "Application Submitted" using shadcn Typography
- [ ] 4.3 Add message "We'll review your application and contact you within 2 business days"
- [ ] 4.4 Add "Return to Dashboard" button using shadcn Button component
- [ ] 4.5 Wire button onClick to navigate to `/dashboard` using TanStack Router
- [ ] 4.6 Ensure no "Check Status" button or loan tracking UI is present
- [ ] 4.7 Verify route is under `_auth` layout to require authentication

## 5. Manual Verification and Testing

- [ ] 5.1 Run `bun run check-types` to verify no TypeScript errors
- [ ] 5.2 Run `bun run dev` and navigate to `/loan` as authenticated user
- [ ] 5.3 Verify all three dropdowns render with correct options (no defaults selected)
- [ ] 5.4 Verify submit button is disabled until all fields are selected
- [ ] 5.5 Submit form with EUR 25,000, Car, 24 months
- [ ] 5.6 Verify inline "Verify Identity" UI displays (QR or DC API based on stored mode)
- [ ] 5.7 Complete wallet verification and verify redirect to `/loan/success`
- [ ] 5.8 Verify success page displays correct heading and message
- [ ] 5.9 Click "Return to Dashboard" and verify navigation works
- [ ] 5.10 Test with dc_api mode (if available) to verify DC API flow works
- [ ] 5.11 Test timeout scenario by not completing verification for 5+ minutes
- [ ] 5.12 Test "Try Again" button resets form correctly
- [ ] 5.13 Verify unauthenticated users cannot access `/loan` or `/loan/success`
- [ ] 5.14 Run `bun run lint` and `bun run format` to ensure code style compliance
