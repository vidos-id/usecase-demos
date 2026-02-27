## 1. Fallback and Recovery

- [ ] 1.1 Implement deterministic fallback mode covering booking through confirmation.
- [ ] 1.2 Implement recovery actions for rejected, expired, and error verification outcomes.
- [ ] 1.3 Ensure payment and confirmation progression rules work in fallback mode.

## 2. Persistence Resilience

- [ ] 2.1 Add persisted-state validation for booking and verification restore flows.
- [ ] 2.2 Implement safe reset behavior on malformed or incompatible persisted data.
- [ ] 2.3 Validate refresh recovery across in-progress booking and verification states.

## 3. Demo Operations

- [ ] 3.1 Implement one-step reset control to clear local state and restart journey.
- [ ] 3.2 Implement local operator timeline for booking and verification lifecycle milestones.
- [ ] 3.3 Add persistent fallback-mode indicator when fallback behavior is active.

## 4. Validation

- [ ] 4.1 Validate full completion path in live mode.
- [ ] 4.2 Validate full completion path in fallback mode.
- [ ] 4.3 Validate reset/restart behavior and operator timeline visibility.
