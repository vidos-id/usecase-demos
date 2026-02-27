## 1. Mock Payment Stage

- [ ] 1.1 Implement payment stage with prefilled card details rendered as read-only.
- [ ] 1.2 Add deterministic local confirm action that sets booking state to payment_confirmed.
- [ ] 1.3 Add clear simulated-payment labeling to payment stage.

## 2. Confirmation and Pickup Experience

- [ ] 2.1 Implement final confirmation view with booking reference and rental summary.
- [ ] 2.2 Implement self-pickup module showing pickup point, locker ID, and locker PIN.
- [ ] 2.3 Implement eligibility statement derived from verification outcome.

## 3. Credential Highlights

- [ ] 3.1 Render required credential highlights (name, mDL number, expiry, driving privileges).
- [ ] 3.2 Render portrait/photo highlight when disclosed data is available.
- [ ] 3.3 Add fallback rendering for missing optional highlight fields.

## 4. Validation

- [ ] 4.1 Validate payment stage is non-editable and progression is deterministic.
- [ ] 4.2 Validate confirmation view includes booking, pickup, and credential highlight sections.
- [ ] 4.3 Validate eligibility messaging reflects verification result state.
