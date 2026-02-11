## Why

The DemoBank application needs session management and demo data reset capabilities to support demo operations. Users need the ability to sign out of their current session, and administrators need the ability to fully reset all demo state (users and sessions) to restore the application to a clean initial state for new demonstrations.

## What Changes

- Add user sign-out functionality that destroys the current session
- Add DELETE /api/session endpoint for session termination
- Add full demo data reset functionality that purges all users and sessions
- Add client-side confirmation dialog before executing reset
- Add DELETE /api/admin/reset endpoint for clearing all demo state
- Integrate sign-out option into account menu
- Integrate reset option into account menu
- Add post-reset confirmation message to user

## Capabilities

### New Capabilities
- `sign-out`: User logout functionality that destroys the current session, clears client session storage, and redirects to landing page
- `sign-out-endpoint`: DELETE /api/session server endpoint that destroys only the current user's session
- `reset-demo-data`: Full demo state purge functionality accessible from account menu
- `reset-confirmation-dialog`: Client-side confirmation dialog requiring user approval before executing reset operation
- `reset-endpoint`: DELETE /api/admin/reset server endpoint that clears all in-memory users and sessions

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

**Server (`server/src/`):**
- New DELETE /api/session endpoint
- New DELETE /api/admin/reset endpoint
- Session destruction logic for current session
- Full state purge logic for all users and sessions

**Client (`client/src/`):**
- Account menu UI updates (sign out and reset options)
- Confirmation dialog component for reset action
- Session clearing and redirect logic
- Post-reset confirmation message display

**Shared (`shared/src/`):**
- API schema definitions for DELETE /api/session
- API schema definitions for DELETE /api/admin/reset

**Dependencies:**
- Requires `core-infrastructure` change (session and user in-memory stores)
