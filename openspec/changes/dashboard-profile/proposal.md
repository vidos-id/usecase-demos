## Why

After successful authentication via PID, users need to access their account information and verify their identity data was correctly captured. This change provides the core logged-in user experience: a dashboard showing account status with fake demo data for demonstration purposes, and a profile page displaying PID-sourced user information.

## What Changes

- Add protected dashboard page with welcome message, fake account balance, transaction history, and action buttons
- Add protected profile page displaying user's PID-sourced data (name, portrait, address, birth date)
- Add session validation endpoint to check current session status and presentation mode
- Add user profile endpoint to fetch current user data
- Generate fake transaction history for demo purposes
- Create account menu component with navigation options

## Capabilities

### New Capabilities
- `dashboard-page`: Main account overview page with welcome message, fake balance (EUR 12,450.00), 2-3 fake recent transactions, and action buttons (Send Money, Apply for Loan, View Profile)
- `profile-page`: User profile display showing PID-sourced data including name, portrait (if provided), address, and birth date
- `session-endpoint`: GET /api/session endpoint to check current session validity, return session mode (direct_post/dc_api), and user ID
- `user-profile-endpoint`: GET /api/users/me endpoint to fetch current authenticated user's profile data
- `fake-transaction-data`: In-memory demo transaction history generator for display purposes
- `account-menu`: Navigation component with "Sign Out" and "Reset All Demo Data" options (per PRD)

### Modified Capabilities
<!-- No existing specs are being modified -->

## Impact

**Affected Code:**
- `client/src/routes/` - New route files for `/dashboard` and `/profile`
- `client/src/components/ui/` - New account menu component
- `server/src/index.ts` - New GET endpoints for session and user profile
- `shared/src/api/` - New Zod schemas for session and user profile responses

**Dependencies:**
- Requires completed `auth-flows` change for user creation and session management
- Session store must exist with userId and mode fields
- User store must exist with profile data from PID

**Breaking Changes:**
- None
