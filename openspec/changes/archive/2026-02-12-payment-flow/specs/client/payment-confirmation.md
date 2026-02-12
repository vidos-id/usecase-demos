# payment-confirmation

## ADDED Requirements

### Requirement: Display transaction summary
The system SHALL display read-only transaction details from URL search parameters.

#### Scenario: Display transaction details from search params
- **WHEN** user navigates to /send/confirm with recipient, amount, and reference search params
- **THEN** system displays transaction summary showing all provided details

#### Scenario: Display transaction without reference
- **WHEN** user navigates to /send/confirm with recipient and amount but no reference param
- **THEN** system displays summary with recipient and amount, omitting reference field

#### Scenario: Missing required search params
- **WHEN** user navigates to /send/confirm without recipient or amount search params
- **THEN** system shows validation error or redirects to /send

### Requirement: Trigger payment verification
The system SHALL create payment authorization request when user clicks "Confirm with EUDI Wallet" button.

#### Scenario: Trigger payment verification
- **WHEN** user clicks "Confirm with EUDI Wallet" button
- **THEN** system posts transaction data to POST /api/payment/request endpoint

#### Scenario: Receive direct_post response
- **WHEN** payment request returns with authorizeUrl
- **THEN** system displays QR code with authorization URL

#### Scenario: Receive dc_api response
- **WHEN** payment request returns with dcApiRequest
- **THEN** system invokes navigator.credentials.get() with DC API request

### Requirement: Reuse session presentation mode
The system SHALL use the presentation mode stored in user's session without offering mode selection.

#### Scenario: No mode selection UI
- **WHEN** confirmation page renders
- **THEN** system does not display mode selection options (direct_post/dc_api)

#### Scenario: Session mode determines verification flow
- **WHEN** user confirms payment
- **THEN** server uses session's stored mode to create authorization request

### Requirement: Display verification UI for direct_post mode
The system SHALL display QR code and deeplink for direct_post authorization flow.

#### Scenario: QR code displayed
- **WHEN** payment request returns authorizeUrl for direct_post mode
- **THEN** system renders QR code containing authorization URL

#### Scenario: Deeplink available
- **WHEN** QR code is displayed
- **THEN** system provides clickable deeplink for mobile wallet app

#### Scenario: Poll authorization status
- **WHEN** QR code is displayed
- **THEN** system starts polling GET /api/payment/status/:requestId at 1s intervals with exponential backoff to 5s

### Requirement: Handle DC API verification for dc_api mode
The system SHALL invoke Digital Credentials API and forward response to server.

#### Scenario: Invoke DC API
- **WHEN** payment request returns dcApiRequest
- **THEN** system calls navigator.credentials.get() with dcApiRequest data

#### Scenario: Forward DC API response
- **WHEN** navigator.credentials.get() resolves with DigitalCredential
- **THEN** system posts credential to POST /api/payment/complete/:requestId

#### Scenario: DC API user cancellation
- **WHEN** user cancels wallet interaction in DC API flow
- **THEN** system displays error message and returns to transaction summary

### Requirement: Handle authorization completion
The system SHALL navigate to success page upon successful payment verification.

#### Scenario: Completion after polling (direct_post)
- **WHEN** status polling returns "authorized"
- **THEN** system posts to /api/payment/complete/:requestId and navigates to /send/success

#### Scenario: Completion with DC API response
- **WHEN** POST /api/payment/complete/:requestId succeeds with dc_api response
- **THEN** system navigates to /send/success with transaction details

#### Scenario: Navigate with transaction data
- **WHEN** payment completion succeeds
- **THEN** system navigates to /send/success with transactionId, recipient, amount, and reference in search params

### Requirement: Display verification errors
The system SHALL show clear error messages for verification failures.

#### Scenario: Authorization rejected
- **WHEN** status polling returns "rejected"
- **THEN** system displays error message and option to retry or cancel

#### Scenario: Authorization expired
- **WHEN** status polling returns "expired" or 5-minute timeout occurs
- **THEN** system displays timeout message and option to restart payment

#### Scenario: Network error during polling
- **WHEN** status polling fails with network error
- **THEN** system retries with backoff and displays error if retries exhausted

#### Scenario: Server error during completion
- **WHEN** POST /api/payment/complete/:requestId returns 500 error
- **THEN** system displays error message and option to retry

### Requirement: Reuse verification components
The system SHALL reuse QR code, DC API handler, and polling components from auth-flows.

#### Scenario: QR code component reused
- **WHEN** direct_post verification is triggered
- **THEN** system renders same QRCodeDisplay component used in auth flows

#### Scenario: DC API handler reused
- **WHEN** dc_api verification is triggered
- **THEN** system uses same DcApiHandler component used in auth flows

#### Scenario: Polling logic reused
- **WHEN** status polling starts
- **THEN** system uses same polling hook with 1s → 5s exponential backoff and 5min timeout as auth flows
