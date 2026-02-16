## 1. Shared Schemas

- [x] 1.1 Create shared/src/types/auth.ts with PresentationMode and ExtractedClaims schemas
- [x] 1.2 Create shared/src/api/signup.ts with request/response schemas for signup endpoints
- [x] 1.3 Create shared/src/api/signin.ts with request/response schemas for signin endpoints
- [x] 1.4 Export userSchema in shared/src/types if not already present

## 2. Server - Pending Requests Store

- [x] 2.1 Create server/src/stores/pendingRequests.ts with in-memory Map for requestId → { authId, mode, flow }
- [x] 2.2 Add TTL-based cleanup for expired requests (10 minute timeout)

## 3. Server - Signup Endpoints

- [x] 3.1 Create server/src/routes/signup.ts with method-chained Hono routes
- [x] 3.2 Implement POST /api/signup/request endpoint (create Vidos auth request, store in pendingRequests)
- [x] 3.3 Implement GET /api/signup/status/:requestId endpoint (poll Vidos API, create user/session on authorized)
- [x] 3.4 Implement POST /api/signup/complete/:requestId endpoint (handle DC API response, create user/session)
- [x] 3.5 Add Zod validation with zValidator for all signup endpoints
- [x] 3.6 Wire signup routes into main Hono app (server/src/index.ts)

## 4. Server - Signin Endpoints

- [x] 4.1 Create server/src/routes/signin.ts with method-chained Hono routes
- [x] 4.2 Implement POST /api/signin/request endpoint (create Vidos auth request, store in pendingRequests)
- [x] 4.3 Implement GET /api/signin/status/:requestId endpoint (poll Vidos API, match user by identifier, create session)
- [x] 4.4 Implement POST /api/signin/complete/:requestId endpoint (handle DC API response, match user, create session)
- [x] 4.5 Add 404 error handling for "No account found with this identity. Please sign up first."
- [x] 4.6 Add Zod validation with zValidator for all signin endpoints
- [x] 4.7 Wire signin routes into main Hono app (server/src/index.ts)

## 5. Client - Mode Selection UI

- [x] 5.1 Create client/src/components/auth/mode-selector.tsx with radio group for presentation modes
- [x] 5.2 Implement DC API feature detection (check navigator.credentials and DigitalCredential)
- [x] 5.3 Show dc_api option only when browser supports it
- [x] 5.4 Default to direct_post mode
- [x] 5.5 Persist selected mode in localStorage
- [x] 5.6 Restore mode from localStorage on page load

## 6. Client - QR Code Display (direct_post mode)

- [x] 6.1 Install qrcode.react dependency
- [x] 6.2 Create client/src/components/auth/qr-code-display.tsx component
- [x] 6.3 Render QR code with authorizeUrl (256x256, error correction level M)
- [x] 6.4 Make QR code responsive with max-width and aspect-ratio
- [x] 6.5 Add "Open on this device" deep link button for mobile

## 7. Client - DC API Flow (dc_api mode)

- [x] 7.1 Create client/src/components/auth/dc-api-handler.tsx component
- [x] 7.2 Implement navigator.credentials.get() invocation with dcApiRequest
- [x] 7.3 Handle user approval (resolve with DigitalCredential)
- [x] 7.4 Handle user rejection (AbortError)
- [x] 7.5 Forward credential response to POST /api/{flow}/complete/:requestId
- [x] 7.6 Display error if DC API is unavailable during invocation

## 8. Client - Polling for direct_post Mode

- [x] 8.1 Create client/src/components/auth/polling-status.tsx component
- [x] 8.2 Implement exponential backoff polling (start 1s, max 5s, timeout 5min)
- [x] 8.3 Poll GET /api/{flow}/status/:requestId until authorized, rejected, expired, or error
- [x] 8.4 Stop polling on component unmount (useEffect cleanup)
- [x] 8.5 Display "Waiting for wallet response..." during polling
- [x] 8.6 Display timeout warning after 2 minutes with restart button

## 9. Client - Signup Page

- [x] 9.1 Create client/src/routes/signup.tsx with TanStack Router route
- [x] 9.2 Integrate mode-selector component
- [x] 9.3 Implement state machine: idle → requesting → awaiting_verification → completing → success/error
- [x] 9.4 Handle POST /api/signup/request and show QR code or trigger DC API
- [x] 9.5 For direct_post: start polling and redirect on authorized
- [x] 9.6 For dc_api: invoke DC API handler and redirect on completion
- [x] 9.7 Display loading states during request, verification, and completion
- [x] 9.8 Redirect to /profile on successful signup

## 10. Client - Signin Page

- [x] 10.1 Create client/src/routes/signin.tsx with TanStack Router route
- [x] 10.2 Integrate mode-selector component
- [x] 10.3 Implement state machine: idle → requesting → awaiting_verification → completing → success/error
- [x] 10.4 Handle POST /api/signin/request and show QR code or trigger DC API
- [x] 10.5 For direct_post: start polling and redirect on authorized
- [x] 10.6 For dc_api: invoke DC API handler and redirect on completion
- [x] 10.7 Display "No account found" error with link to /signup on 404
- [x] 10.8 Display loading states during request, verification, and completion
- [x] 10.9 Redirect to /dashboard on successful signin

## 11. Client - Error Handling

- [x] 11.1 Display error messages for rejected, expired, and error statuses
- [x] 11.2 Add retry button for all error states
- [x] 11.3 Handle network errors during API calls
- [x] 11.4 Show timeout error after 5 minutes of polling

## 12. Client - Helper Utilities

- [x] 12.1 Create client/src/lib/auth-helpers.ts with isDCApiSupported function
- [x] 12.2 Add getStoredMode and setStoredMode functions for localStorage
- [x] 12.3 Add typed Hono client import from server/client

## 13. Testing and Verification

- [x] 13.1 Manual test: signup with direct_post mode (QR code on desktop)
- [x] 13.2 Manual test: signup with direct_post mode (deep link on mobile)
- [x] 13.3 Manual test: signup with dc_api mode (browser wallet)
- [x] 13.4 Manual test: signin with existing user (both modes)
- [x] 13.5 Manual test: signin with no account (verify 404 error and signup link)
- [x] 13.6 Manual test: mode persistence in localStorage
- [x] 13.7 Manual test: polling timeout and restart flow
- [x] 13.8 Manual test: DC API feature detection on supported/unsupported browsers
- [x] 13.9 Verify type safety: client autocomplete for all API endpoints
- [x] 13.10 Run `bun run check-types` to verify no TypeScript errors
