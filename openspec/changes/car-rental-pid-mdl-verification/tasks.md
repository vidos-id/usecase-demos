## 1. Dual Credential Request Setup

- [ ] 1.1 Define DCQL request contract with PID and mDL credential entries and stable IDs.
- [ ] 1.2 Implement verification request creation from valid booking context.
- [ ] 1.3 Validate request payload generation includes both credential requirements.

## 2. Authorizer Correlation and Persistence

- [ ] 2.1 Persist `authorizerId` and `bookingId` correlation on verification start.
- [ ] 2.2 Restore correlation after refresh and resume verification status flow.
- [ ] 2.3 Enforce correlation integrity checks before applying retrieved results.

## 3. Verification Lifecycle and Gating

- [ ] 3.1 Implement lifecycle states: created, pending_wallet, processing, success, rejected, expired, error.
- [ ] 3.2 Render lifecycle status changes in verification UI.
- [ ] 3.3 Gate payment progression to successful verification unless fallback mode is active.

## 4. Policy and Disclosed Data Handling

- [ ] 4.1 Normalize authorizer policy results into structured status model.
- [ ] 4.2 Normalize disclosed PID and mDL claims into stable view model.
- [ ] 4.3 Implement fallback rendering for missing optional disclosed claims.

## 5. Validation

- [ ] 5.1 Validate success flow from verification start through payment unlock.
- [ ] 5.2 Validate rejected/expired/error flows block payment and expose recovery actions.
- [ ] 5.3 Validate correlation mismatch is rejected and not applied to booking state.
