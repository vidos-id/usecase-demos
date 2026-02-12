## 1. Shared Payment Schemas

- [x] 1.1 Create shared/src/api/payment.ts with paymentRequestSchema (recipient, amount, reference)
- [x] 1.2 Add paymentRequestResponseSchema (requestId, authorizeUrl, dcApiRequest)
- [x] 1.3 Add paymentStatusResponseSchema (status enum, claims optional)
- [x] 1.4 Add paymentCompleteRequestSchema (dcResponse optional)
- [x] 1.5 Add paymentCompleteResponseSchema (transactionId, confirmedAt, verifiedIdentity, transaction)
- [x] 1.6 Create shared/src/types/payment.ts with TransactionData and RecipientTemplate types

## 2. Server Payment Request API

- [x] 2.1 Create server/src/stores/pendingPayments.ts for in-memory payment storage
- [x] 2.2 Create server/src/routes/payment.ts with POST /api/payment/request endpoint
- [x] 2.3 Implement session mode retrieval (direct_post or dc_api)
- [x] 2.4 Implement transaction ID generation (txn-{timestamp}-{random8chars})
- [x] 2.5 Integrate Vidos service createAuthorizationRequest with minimal PID attributes (family_name, given_name, personal_administrative_number, document_number)
- [x] 2.6 Store pending payment metadata (requestId, transactionId, authId, mode, transaction, createdAt)
- [x] 2.7 Add authentication middleware to payment request endpoint

## 3. Server Payment Status & Completion

- [x] 3.1 Add GET /api/payment/status/:requestId endpoint for polling
- [x] 3.2 Implement status polling logic (check Vidos API authorization status)
- [x] 3.3 Return normalized claims when status is "authorized"
- [x] 3.4 Handle expired status for requests older than 5 minutes
- [x] 3.5 Add POST /api/payment/complete/:requestId endpoint
- [x] 3.6 Implement identity verification (match PID identifier with session user)
- [x] 3.7 Return 403 error if identity mismatch detected
- [x] 3.8 Handle DC API response extraction in complete endpoint
- [x] 3.9 Retrieve and return transaction metadata in completion response

## 4. Server Route Integration

- [x] 4.1 Import payment routes in server/src/index.ts
- [x] 4.2 Method-chain payment routes to Hono app (.post().get().post() pattern)
- [x] 4.3 Verify TypeScript inference of payment route types

## 5. Payment Form UI

- [x] 5.1 Create client/src/routes/_auth/send/index.tsx route component
- [x] 5.2 Create client/src/components/payment/recipient-templates.tsx with hardcoded templates
- [x] 5.3 Create client/src/components/payment/transaction-form.tsx with recipient, amount, reference fields
- [x] 5.4 Implement form validation (recipient 1-100 chars, amount EUR format, reference max 200 chars)
- [x] 5.5 Implement template click handler to auto-fill recipient and amount
- [x] 5.6 Add form submission handler to navigate to /send/confirm with search params
- [x] 5.7 Add form validation error displays

## 6. Payment Confirmation UI

- [x] 6.1 Create client/src/routes/_auth/send/confirm.tsx with search param validation
- [x] 6.2 Create client/src/components/payment/transaction-summary.tsx for read-only transaction display
- [x] 6.3 Add "Confirm with EUDI Wallet" button handler to call POST /api/payment/request
- [x] 6.4 Implement response handling for direct_post mode (display QR code)
- [x] 6.5 Implement response handling for dc_api mode (invoke navigator.credentials.get)
- [x] 6.6 Reuse QRCodeDisplay component from auth-flows
- [x] 6.7 Reuse DcApiHandler component from auth-flows

## 7. Payment Verification Flow

- [x] 7.1 Reuse polling hook from auth-flows (1s → 5s exponential backoff, 5min timeout)
- [x] 7.2 Implement status polling for direct_post mode (GET /api/payment/status/:requestId)
- [x] 7.3 Add polling cleanup on component unmount
- [x] 7.4 Display real-time verification status messages (pending, processing, authorized)
- [x] 7.5 Handle DC API user cancellation with error message
- [x] 7.6 Handle authorization rejection with error message and retry option
- [x] 7.7 Handle authorization expiration with timeout message
- [x] 7.8 Call POST /api/payment/complete/:requestId on authorized status or DC API success

## 8. Payment Success Page

- [x] 8.1 Create client/src/routes/_auth/send/success.tsx with search param validation
- [x] 8.2 Display "Payment Confirmed" title and success message
- [x] 8.3 Display transaction details (transactionId, recipient, amount, reference)
- [x] 8.4 Display verified identity (name and identifier from completion response)
- [x] 8.5 Display confirmation timestamp (ISO format)
- [x] 8.6 Add demo mode notice alert ("Demo mode: Your balance has not been updated...")
- [x] 8.7 Add "Back to Dashboard" button navigating to /dashboard
- [x] 8.8 Handle missing search params with error or redirect

## 9. Manual Verification

- [x] 9.1 Test payment form renders with templates
- [x] 9.2 Test template click auto-fills recipient and amount
- [x] 9.3 Test form validation for all fields
- [x] 9.4 Test navigation to confirmation with search params
- [x] 9.5 Test payment request creation with direct_post mode (QR code display)
- [x] 9.6 Test payment request creation with dc_api mode (Digital Credentials API invocation)
- [x] 9.7 Test status polling until authorized
- [x] 9.8 Test payment completion with identity verification
- [x] 9.9 Test success page displays all transaction details
- [x] 9.10 Test identity mismatch returns 403 error
- [x] 9.11 Test authorization expiration/rejection error handling
- [x] 9.12 Test balance remains unchanged on dashboard after payment
