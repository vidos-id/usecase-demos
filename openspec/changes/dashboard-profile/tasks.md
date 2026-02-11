## 1. Shared Schemas

- [ ] 1.1 Create `shared/src/api/session.ts` with sessionResponseSchema (authenticated, userId, mode fields)
- [ ] 1.2 Create `shared/src/api/users-me.ts` with userProfileResponseSchema (familyName, givenName, address, birthDate, nationality, optional portrait)
- [ ] 1.3 Add subpath exports in `shared/package.json` for "./api/session" and "./api/users-me"

## 2. Server - Session Endpoint

- [ ] 2.1 Add `GET /api/session` route to Hono app (method-chained) that extracts Bearer token from Authorization header
- [ ] 2.2 Implement session lookup logic returning `{ authenticated: false }` when no/invalid token
- [ ] 2.3 Implement session lookup logic returning `{ authenticated: true, userId, mode }` for valid sessions
- [ ] 2.4 Validate response against sessionResponseSchema before returning

## 3. Server - Users/Me Endpoint

- [ ] 3.1 Add `GET /api/users/me` route to Hono app (method-chained) with session authentication
- [ ] 3.2 Return HTTP 401 Unauthorized when session is invalid or missing
- [ ] 3.3 Return HTTP 401 Unauthorized when session exists but user is deleted
- [ ] 3.4 Fetch user from users store and return all PID fields (familyName, givenName, address, birthDate, nationality, portrait)
- [ ] 3.5 Validate response against userProfileResponseSchema before returning

## 4. Server - Fake Transaction Data

- [ ] 4.1 Create `server/src/data/fakeTransactions.ts` with getFakeTransactions function
- [ ] 4.2 Implement static array with 2-3 realistic transactions (date YYYY-MM-DD, merchant, amount, currency EUR)
- [ ] 4.3 Include mix of debit (negative) and credit (positive) amounts
- [ ] 4.4 Use realistic merchant names (Supermart, Coffee Corner, Salary Deposit, etc.)

## 5. Client - Protected Route Layout

- [ ] 5.1 Create `client/src/routes/_auth.tsx` layout route with beforeLoad hook
- [ ] 5.2 Implement beforeLoad to call `GET /api/session` using hc client
- [ ] 5.3 Redirect to "/" when session response has `authenticated: false`
- [ ] 5.4 Store session mode in context or route context for child routes

## 6. Client - Dashboard Page

- [ ] 6.1 Create `client/src/routes/_auth/dashboard.tsx` route file
- [ ] 6.2 Fetch user profile from `GET /api/users/me` in route loader
- [ ] 6.3 Display welcome message with "Welcome, [givenName] [familyName]"
- [ ] 6.4 Display hardcoded account balance "EUR 12,450.00" with proper formatting
- [ ] 6.5 Fetch and display 2-3 fake transactions with date, merchant, and formatted amount (negative for debits, positive for credits)
- [ ] 6.6 Add "Send Money" button (placeholder for payment-flow change)
- [ ] 6.7 Add "Apply for Loan" button (placeholder for loan-flow change)
- [ ] 6.8 Add "View Profile" button that navigates to /profile

## 7. Client - Profile Page

- [ ] 7.1 Create `client/src/routes/_auth/profile.tsx` route file
- [ ] 7.2 Fetch user profile from `GET /api/users/me` in route loader
- [ ] 7.3 Display user's full name (givenName and familyName)
- [ ] 7.4 Display portrait using data URI format `data:image/jpeg;base64,{portrait}` if portrait exists
- [ ] 7.5 Display fallback initials (first letter of givenName + familyName) when portrait is missing
- [ ] 7.6 Display user's address from PID data
- [ ] 7.7 Display user's birthDate from PID data
- [ ] 7.8 Display user's nationality from PID data

## 8. Client - Account Menu Component

- [ ] 8.1 Create `client/src/components/layout/account-menu.tsx` component
- [ ] 8.2 Display user's name or initials/avatar in menu trigger
- [ ] 8.3 Show portrait as avatar in trigger if available
- [ ] 8.4 Implement dropdown menu behavior (opens on click, closes on selection or outside click)
- [ ] 8.5 Add "Sign Out" option that clears session and redirects to "/"
- [ ] 8.6 Add "Reset Demo Data" option that calls admin reset endpoint and redirects to "/"
- [ ] 8.7 Integrate account menu into header of `_auth` layout route

## 9. Manual Verification

- [ ] 9.1 Verify server starts without errors after adding new endpoints
- [ ] 9.2 Verify `GET /api/session` returns `{ authenticated: false }` when not logged in
- [ ] 9.3 Verify `GET /api/session` returns `{ authenticated: true, userId, mode }` after successful auth
- [ ] 9.4 Verify `GET /api/users/me` returns 401 when unauthenticated
- [ ] 9.5 Verify `GET /api/users/me` returns full user profile with PID data when authenticated
- [ ] 9.6 Verify unauthenticated access to /dashboard redirects to /
- [ ] 9.7 Verify unauthenticated access to /profile redirects to /
- [ ] 9.8 Verify dashboard displays welcome message, balance EUR 12,450.00, and 2-3 transactions
- [ ] 9.9 Verify profile page displays all PID data including portrait (if available) or initials fallback
- [ ] 9.10 Verify account menu appears in header with Sign Out and Reset options
- [ ] 9.11 Verify "View Profile" button on dashboard navigates to /profile
- [ ] 9.12 Verify Sign Out clears session and redirects to home
