## 1. Shared Schemas & Constants

- [x] 1.1 Add `PROFILE_UPDATE_CLAIMS` and `PROFILE_UPDATE_PURPOSE` to `shared/src/lib/claims.ts`
- [x] 1.2 Create `shared/src/api/profile-update.ts` with request/status/complete schemas
- [x] 1.3 Create `shared/src/types/profile-update.ts` with claims schema for profile update flow

## 2. Server Endpoints

- [x] 2.1 Create `server/src/routes/profile-update.ts` with three-endpoint pattern (request/status/complete)
- [x] 2.2 Wire profile-update router into main app in `server/src/index.ts`
- [x] 2.3 Implement claim-to-user-field mapping in profile update route

## 3. Client Profile Update UI

- [x] 3.1 Add inline field selection section to `client/src/routes/_auth/profile.tsx`
- [x] 3.2 Add "Update Profile" button that expands field selection
- [x] 3.3 Implement field checkbox state management
- [x] 3.4 Add Continue/Cancel buttons with proper enabled state

## 4. Client Authorization Flow

- [x] 4.1 Implement `useProfileUpdate` mutation hook for initiating update request
- [x] 4.2 Integrate with existing verification flow (QR or DC API based on mode)
- [x] 4.3 Handle verification success - show updated fields confirmation
- [x] 4.4 Handle verification failure - show error and allow retry

## 5. Cache & Polish

- [x] 5.1 Invalidate `["user", "me"]` query on successful update
- [x] 5.2 Collapse field selection and show success state after update
- [ ] 5.3 Test full flow with both QR and DC API modes
