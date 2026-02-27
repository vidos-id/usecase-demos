## 1. Booking Journey UX

- [ ] 1.1 Implement search stage with required location and rental date/time inputs.
- [ ] 1.2 Implement vehicle selection stage with realistic car options and pricing summary.
- [ ] 1.3 Implement booking review stage showing selected rental details before verification.

## 2. Booking State Model and Transitions

- [ ] 2.1 Define booking lifecycle states and allowed transitions.
- [ ] 2.2 Implement transition guards that block verification when booking data is incomplete.
- [ ] 2.3 Create booking context generation with unique `bookingId` at pre-verification handoff.

## 3. Local Persistence and Restore

- [ ] 3.1 Persist in-progress booking context locally with minimal required fields.
- [ ] 3.2 Implement restore behavior for draft/review booking states after refresh.
- [ ] 3.3 Implement safe reset behavior when persisted booking data is invalid.

## 4. Validation

- [ ] 4.1 Validate stage progression from search to review to verification handoff.
- [ ] 4.2 Validate blocked progression for incomplete booking context.
- [ ] 4.3 Validate refresh recovery behavior across booking stages.
