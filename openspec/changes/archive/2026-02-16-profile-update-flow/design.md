## Context

The app follows a consistent authorization flow pattern (signup, signin, payment, loan) where:
1. Client requests authorization → server creates Vidos auth request → returns request ID + auth details
2. Client polls status OR completes via DC API
3. Server extracts claims from verified credential → performs domain action

Profile update reuses this pattern but differs in that:
- User is already authenticated (has session)
- Claims update existing user record rather than creating new entities
- Only user-selected fields are requested from the credential

Current profile view (`client/src/routes/_auth/profile.tsx`) displays static user data with no edit capability.

## Goals / Non-Goals

**Goals:**
- Allow authenticated users to refresh specific profile fields from their PID credential
- Reuse existing Vidos authorization infrastructure
- Maintain type safety across client/server/shared
- Invalidate stale client data after update

**Non-Goals:**
- Free-form profile editing (all data must come from verified credential)
- Bulk/admin profile updates
- Changing fields not present in PID credential (e.g., balance, activity)

## Decisions

### 1. Inline Field Selection (No Dialog)
Profile page expands to show field selection checkboxes inline when user clicks "Update Profile". Better mobile UX - no overlay that may cause issues on small screens or with wallet interactions.

**Rationale**: Mobile-first approach. Inline expansion keeps user in context, avoids modal dismissal issues during wallet redirect/return. Minimizes unnecessary credential disclosure per EUDI minimal disclosure principle.

**Alternatives considered**:
- Dialog/modal → poor mobile UX, potential issues with wallet redirects
- Always request all fields → simpler but over-requests data
- Per-field update buttons → cluttered UI, multiple verification flows

### 2. Three-Endpoint Pattern (request/status/complete)
Follow existing signup/signin pattern:
- `POST /api/profile/update/request` - create auth request with selected claims
- `GET /api/profile/update/status/:requestId` - poll for QR code flow
- `POST /api/profile/update/complete/:requestId` - DC API completion

**Rationale**: Proven pattern in codebase, supports both QR and DC API modes, reuses pending request store.

**Alternatives considered**:
- Single endpoint with WebSocket → added complexity, no existing WS infrastructure
- Reuse signin endpoint with "update" mode → conflates different concerns

### 3. Updatable Fields Constant in Shared
Define `PROFILE_UPDATE_CLAIMS` in `shared/lib/claims.ts` listing all fields that can be updated:
```ts
export const PROFILE_UPDATE_CLAIMS = [
  "family_name", "given_name", "birth_date", "nationality",
  "email_address", "resident_address", "portrait"
] as const;
```

**Rationale**: Single source of truth for UI checkboxes and server validation. Prevents requesting non-updatable fields.

### 4. Partial User Update from Claims
Server maps verified claims to user fields and calls `updateUser()` with only the fields present in response.

**Rationale**: `updateUser()` already supports partial updates. Claims schema validates expected shape.

### 5. React Query Cache Invalidation
After successful update, invalidate `["user", "me"]` query key to refetch fresh profile data.

**Rationale**: Simple, reliable. Profile data is small enough that refetch is acceptable vs. optimistic update complexity.

## Risks / Trade-offs

**[Risk]** User's wallet may not support selective disclosure for all requested fields
→ Mitigation: Accept whatever claims are returned, update only those fields. UI shows which fields were actually updated.

**[Risk]** Concurrent update requests could race
→ Mitigation: Low risk for single-user profile. `updateUser()` is transactional. Accept last-write-wins semantics.

**[Trade-off]** Requires full credential verification even for single field update
→ Acceptable: Security over convenience. Credential verification is fast with DC API.
