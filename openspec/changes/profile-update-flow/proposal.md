## Why

Users cannot update their profile information after signup. When PID credential data changes (name, address, portrait, etc.), users must re-register. The profile view currently shows static data with no update mechanism.

## What Changes

- Add "Update Profile" action to profile view that opens a field selection dialog
- User selects which fields to update (family name, given name, birth date, nationality, email, address, portrait)
- Server builds credential request with only selected fields
- After credential verification, server updates user record with new claims
- Client invalidates user cache to reflect updates immediately

## Capabilities

### New Capabilities
- `profile-update`: Selective profile field update via credential re-verification. Covers field selection UI, dynamic credential request generation, and profile data refresh.

### Modified Capabilities
- `data-models`: Add update profile operation that accepts partial user data from verified claims

## Impact

- **Client**: New dialog component for field selection, profile page gets update action button, React Query cache invalidation
- **Server**: New `/api/profile/update` endpoint trio (request, status, complete) following existing signup/signin pattern
- **Shared**: New API schemas for profile update flow, new claims constant for updatable fields
- **Vidos Integration**: Reuses existing `createAuthorizationRequest` with dynamic claim selection
