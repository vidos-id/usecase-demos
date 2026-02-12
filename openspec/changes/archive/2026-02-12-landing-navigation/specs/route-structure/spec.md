## ADDED Requirements

### Requirement: System defines public routes
The system SHALL define public routes accessible without authentication: `/`, `/signup`, and `/signin`.

#### Scenario: Landing page is public
- **WHEN** unauthenticated user navigates to `/`
- **THEN** system renders landing page without redirecting

#### Scenario: Signup page is public
- **WHEN** unauthenticated user navigates to `/signup`
- **THEN** system renders signup page without redirecting

#### Scenario: Signin page is public
- **WHEN** unauthenticated user navigates to `/signin`
- **THEN** system renders signin page without redirecting

### Requirement: System defines protected routes
The system SHALL define protected routes requiring authentication: `/dashboard`, `/profile`, `/send`, `/send/confirm`, `/send/success`, `/loan`, and `/loan/success`.

#### Scenario: Dashboard requires authentication
- **WHEN** route is `/dashboard`
- **THEN** authentication guard checks session before rendering

#### Scenario: Profile requires authentication
- **WHEN** route is `/profile`
- **THEN** authentication guard checks session before rendering

#### Scenario: Send routes require authentication
- **WHEN** route matches `/send`, `/send/confirm`, or `/send/success`
- **THEN** authentication guard checks session before rendering

#### Scenario: Loan routes require authentication
- **WHEN** route matches `/loan` or `/loan/success`
- **THEN** authentication guard checks session before rendering

### Requirement: Authentication guard redirects unauthenticated users
The system SHALL redirect unauthenticated users attempting to access protected routes to the landing page (`/`).

#### Scenario: Unauthenticated user accesses dashboard
- **WHEN** unauthenticated user navigates to `/dashboard`
- **THEN** system redirects to `/`

#### Scenario: Unauthenticated user accesses profile
- **WHEN** unauthenticated user navigates to `/profile`
- **THEN** system redirects to `/`

#### Scenario: Unauthenticated user accesses send flow
- **WHEN** unauthenticated user navigates to `/send/*`
- **THEN** system redirects to `/`

#### Scenario: Unauthenticated user accesses loan flow
- **WHEN** unauthenticated user navigates to `/loan/*`
- **THEN** system redirects to `/`

### Requirement: System preserves redirect destination after signin
The system SHALL support preserving the intended destination URL when redirecting unauthenticated users, for future use by signin flow.

#### Scenario: Redirect destination is available for future implementation
- **WHEN** authentication guard redirects user
- **THEN** system architecture supports capturing original destination (placeholder implementation redirects to `/`)

### Requirement: System displays 404 for unknown routes
The system SHALL display a 404 error page for routes that do not match any defined route pattern.

#### Scenario: Unknown route shows 404
- **WHEN** user navigates to `/unknown-route`
- **THEN** system displays 404 error page

#### Scenario: Misspelled route shows 404
- **WHEN** user navigates to `/dashbord` (typo)
- **THEN** system displays 404 error page

### Requirement: System uses TanStack Router file-based routing
The system SHALL use TanStack Router's file-based routing convention with route files in `client/src/routes/`.

#### Scenario: Route files define routes
- **WHEN** route file exists at `client/src/routes/index.tsx`
- **THEN** system maps file to `/` route

#### Scenario: Nested route files create path hierarchy
- **WHEN** route file exists at `client/src/routes/send/confirm.tsx`
- **THEN** system maps file to `/send/confirm` route

#### Scenario: Layout routes do not affect URL structure
- **WHEN** route file `_auth.tsx` wraps child routes
- **THEN** child routes use paths without `_auth` prefix in URLs

### Requirement: System auto-generates route tree
The system SHALL automatically generate `routeTree.gen.ts` based on route files in `client/src/routes/`.

#### Scenario: Route tree updates on build
- **WHEN** developer adds or removes route files
- **THEN** TanStack Router regenerates `routeTree.gen.ts` on next build

#### Scenario: Route tree is not manually edited
- **WHEN** `routeTree.gen.ts` exists
- **THEN** file contains auto-generated warning and MUST NOT be manually edited

### Requirement: Authentication guard uses beforeLoad hook
The system SHALL implement authentication guards using TanStack Router's `beforeLoad` hook in layout route.

#### Scenario: beforeLoad hook checks session
- **WHEN** protected route is accessed
- **THEN** `beforeLoad` hook executes session check before rendering

#### Scenario: beforeLoad hook redirects on auth failure
- **WHEN** `beforeLoad` hook detects unauthenticated session
- **THEN** hook throws redirect to `/`

### Requirement: Routes use type-safe navigation
The system SHALL provide type-safe navigation with autocomplete for all defined routes.

#### Scenario: Navigation to route is type-checked
- **WHEN** developer uses TanStack Router's navigation API
- **THEN** TypeScript enforces valid route paths at compile time

#### Scenario: Invalid routes produce TypeScript errors
- **WHEN** developer attempts to navigate to undefined route
- **THEN** TypeScript compiler produces error
