## 1. Shared Schemas

- [ ] 1.1 Create shared/src/types/auth.ts with PresentationMode and ExtractedClaims schemas
- [ ] 1.2 Create shared/src/api/signup.ts with request/response schemas for signup endpoints
- [ ] 1.3 Create shared/src/api/signin.ts with request/response schemas for signin endpoints
- [ ] 1.4 Export userSchema in shared/src/types if not already present

## 2. Server - Pending Requests Store

- [ ] 2.1 Create server/src/stores/pendingRequests.ts with in-memory Map for requestId → { authId, mode, flow }
- [ ] 2.2 Add TTL-based cleanup for expired requests (10 minute timeout)

## 3. Server - Signup Endpoints

- [ ] 3.1 Create server/src/routes/signup.ts with method-chained Hono routes
- [ ] 3.2 Implement POST /api/signup/request endpoint (create Vidos auth request, store in pendingRequests)
- [ ] 3.3 Implement GET /api/signup/status/:requestId endpoint (poll Vidos API, create user/session on authorized)
- [ ] 3.4 Implement POST /api/signup/complete/:requestId endpoint (handle DC API response, create user/session)
- [ ] 3.5 Add Zod validation with zValidator for all signup endpoints
- [ ] 3.6 Wire signup routes into main Hono app (server/src/index.ts)

## 4. Server - Signin Endpoints

- [ ] 4.1 Create server/src/routes/signin.ts with method-chained Hono routes
- [ ] 4.2 Implement POST /api/signin/request endpoint (create Vidos auth request, store in pendingRequests)
- [ ] 4.3 Implement GET /api/signin/status/:requestId endpoint (poll Vidos API, match user by identifier, create session)
- [ ] 4.4 Implement POST /api/signin/complete/:requestId endpoint (handle DC API response, match user, create session)
- [ ] 4.5 Add 404 error handling for "No account found with this identity. Please sign up first."
- [ ] 4.6 Add Zod validation with zValidator for all signin endpoints
- [ ] 4.7 Wire signin routes into main Hono app (server/src/index.ts)

## 5. Client - Mode Selection UI

- [ ] 5.1 Create client/src/components/auth/mode-selector.tsx with radio group for presentation modes
- [ ] 5.2 Implement DC API feature detection (check navigator.credentials and DigitalCredential)
- [ ] 5.3 Show dc_api option only when browser supports it
- [ ] 5.4 Default to direct_post mode
- [ ] 5.5 Persist selected mode in sessionStorage
- [ ] 5.6 Restore mode from sessionStorage on page load

## 6. Client - QR Code Display (direct_post mode)

- [ ] 6.1 Install qrcode.react dependency
- [ ] 6.2 Create client/src/components/auth/qr-code-display.tsx component
- [ ] 6.3 Render QR code with authorizeUrl (256x256, error correction level M)
- [ ] 6.4 Make QR code responsive with max-width and aspect-ratio
- [ ] 6.5 Add "Open on this device" deep link button for mobile

## 7. Client - DC API Flow (dc_api mode)

- [ ] 7.1 Create client/src/components/auth/dc-api-handler.tsx component
- [ ] 7.2 Implement navigator.credentials.get() invocation with dcApiRequest
- [ ] 7.3 Handle user approval (resolve with DigitalCredential)
- [ ] 7.4 Handle user rejection (AbortError)
- [ ] 7.5 Forward credential response to POST /api/{flow}/complete/:requestId
- [ ] 7.6 Display error if DC API is unavailable during invocation

## 8. Client - Polling for direct_post Mode

- [ ] 8.1 Create client/src/components/auth/polling-status.tsx component
- [ ] 8.2 Implement exponential backoff polling (start 1s, max 5s, timeout 5min)
- [ ] 8.3 Poll GET /api/{flow}/status/:requestId until authorized, rejected, expired, or error
- [ ] 8.4 Stop polling on component unmount (useEffect cleanup)
- [ ] 8.5 Display "Waiting for wallet response..." during polling
- [ ] 8.6 Display timeout warning after 2 minutes with restart button

## 9. Client - Signup Page

- [ ] 9.1 Create client/src/routes/signup.tsx with TanStack Router route
- [ ] 9.2 Integrate mode-selector component
- [ ] 9.3 Implement state machine: idle → requesting → awaiting_verification → completing → success/error
- [ ] 9.4 Handle POST /api/signup/request and show QR code or trigger DC API
- [ ] 9.5 For direct_post: start polling and redirect on authorized
- [ ] 9.6 For dc_api: invoke DC API handler and redirect on completion
- [ ] 9.7 Display loading states during request, verification, and completion
- [ ] 9.8 Redirect to /profile on successful signup

## 10. Client - Signin Page

- [ ] 10.1 Create client/src/routes/signin.tsx with TanStack Router route
- [ ] 10.2 Integrate mode-selector component
- [ ] 10.3 Implement state machine: idle → requesting → awaiting_verification → completing → success/error
- [ ] 10.4 Handle POST /api/signin/request and show QR code or trigger DC API
- [ ] 10.5 For direct_post: start polling and redirect on authorized
- [ ] 10.6 For dc_api: invoke DC API handler and redirect on completion
- [ ] 10.7 Display "No account found" error with link to /signup on 404
- [ ] 10.8 Display loading states during request, verification, and completion
- [ ] 10.9 Redirect to /dashboard on successful signin

## 11. Client - Error Handling

- [ ] 11.1 Display error messages for rejected, expired, and error statuses
- [ ] 11.2 Add retry button for all error states
- [ ] 11.3 Handle network errors during API calls
- [ ] 11.4 Show timeout error after 5 minutes of polling

## 12. Client - Helper Utilities

- [ ] 12.1 Create client/src/lib/auth-helpers.ts with isDCApiSupported function
- [ ] 12.2 Add getStoredMode and setStoredMode functions for sessionStorage
- [ ] 12.3 Add typed Hono client import from server/client

## 13. Testing and Verification

- [ ] 13.1 Manual test: signup with direct_post mode (QR code on desktop)
- [ ] 13.2 Manual test: signup with direct_post mode (deep link on mobile)
- [ ] 13.3 Manual test: signup with dc_api mode (browser wallet)
- [ ] 13.4 Manual test: signin with existing user (both modes)
- [ ] 13.5 Manual test: signin with no account (verify 404 error and signup link)
- [ ] 13.6 Manual test: mode persistence in sessionStorage
- [ ] 13.7 Manual test: polling timeout and restart flow
- [ ] 13.8 Manual test: DC API feature detection on supported/unsupported browsers
- [ ] 13.9 Verify type safety: client autocomplete for all API endpoints
- [ ] 13.10 Run `bun run check-types` to verify no TypeScript errors
