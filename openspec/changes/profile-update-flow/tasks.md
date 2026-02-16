## 1. Shared Schemas & Constants

- [ ] 1.1 Add `PROFILE_UPDATE_CLAIMS` and `PROFILE_UPDATE_PURPOSE` to `shared/src/lib/claims.ts`
- [ ] 1.2 Create `shared/src/api/profile-update.ts` with request/status/complete schemas
- [ ] 1.3 Create `shared/src/types/profile-update.ts` with claims schema for profile update flow

## 2. Server Endpoints

- [ ] 2.1 Create `server/src/routes/profile-update.ts` with three-endpoint pattern (request/status/complete)
- [ ] 2.2 Wire profile-update router into main app in `server/src/index.ts`
- [ ] 2.3 Implement claim-to-user-field mapping in profile update route

## 3. Client Profile Update UI

- [ ] 3.1 Add inline field selection section to `client/src/routes/_auth/profile.tsx`
- [ ] 3.2 Add "Update Profile" button that expands field selection
- [ ] 3.3 Implement field checkbox state management
- [ ] 3.4 Add Continue/Cancel buttons with proper enabled state

## 4. Client Authorization Flow

- [ ] 4.1 Implement `useProfileUpdate` mutation hook for initiating update request
- [ ] 4.2 Integrate with existing verification flow (QR or DC API based on mode)
- [ ] 4.3 Handle verification success - show updated fields confirmation
- [ ] 4.4 Handle verification failure - show error and allow retry

## 5. Cache & Polish

- [ ] 5.1 Invalidate `["user", "me"]` query on successful update
- [ ] 5.2 Collapse field selection and show success state after update
- [ ] 5.3 Test full flow with both QR and DC API modes
