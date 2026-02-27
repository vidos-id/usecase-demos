# Car Rental OpenSpec Execution Sequence

This is the execution plan for implementing the approved car-rental OpenSpec changes **sequentially**.

## Execution Principles

1. Execute one change at a time, in strict order.
2. For each change, use artifacts in this order: `proposal.md` -> `design.md` -> `specs/**` -> `tasks.md`.
3. Do not start the next change until the current change has:
   - implementation complete,
   - local smoke validation complete,
   - any required refactors stabilized.
4. Keep each change traceable in commit history (at least one commit per major task group).

## Canonical Order

1. `car-rental-booking-foundation`
2. `car-rental-pid-mdl-verification`
3. `car-rental-payment-pickup-confirmation`
4. `car-rental-demo-reliability`
5. `car-rental-compliance-guardrails`

Rationale:
- Booking creates the base state model.
- Verification depends on booking correlation (`bookingId` + `authorizerId`).
- Payment/confirmation depends on verification outcomes and disclosed data.
- Reliability hardens all previous flow stages.
- Compliance guardrails are applied last as final messaging/semantics alignment pass (without killing demo impact).

---

## Phase 1 - Booking Foundation

Change: `openspec/changes/car-rental-booking-foundation`

### Use these artifacts
- `proposal.md`: scope boundaries for booking-only work
- `design.md`: lifecycle and persistence approach
- `specs/car-rental-booking-journey/spec.md`: normative behavior
- `tasks.md`: implementation checklist

### Deliverables
1. Search/select/review journey complete.
2. Booking lifecycle and transition guards complete.
3. `bookingId` creation before verification complete.
4. Local booking persistence + refresh restore complete.

### Exit criteria
1. User can reliably reach verification handoff from booking review.
2. Invalid booking data cannot advance.
3. Refresh keeps in-progress booking state.

---

## Phase 2 - PID + mDL Verification Core

Change: `openspec/changes/car-rental-pid-mdl-verification`

### Use these artifacts
- `proposal.md`: dual credential + correlation intent
- `design.md`: DCQL + lifecycle + normalization strategy
- `specs/car-rental-pid-mdl-verification/spec.md`
- `specs/car-rental-authorizer-correlation/spec.md`
- `specs/car-rental-policy-and-disclosed-data/spec.md`
- `tasks.md`

### Deliverables
1. Single verification flow requesting PID + mDL via DCQL representation.
2. `authorizerId` <-> `bookingId` correlation + persistence.
3. Verification lifecycle states wired in UI.
4. Policy result model + disclosed claim normalization.

### Exit criteria
1. Successful verification unlocks payment.
2. Rejected/expired/error blocks payment and offers recovery.
3. Refresh during verification restores state and correlation.

---

## Phase 3 - Payment + Confirmation + Pickup

Change: `openspec/changes/car-rental-payment-pickup-confirmation`

### Use these artifacts
- `proposal.md`: completion-flow intent
- `design.md`: read-only payment + high-impact confirmation architecture
- `specs/car-rental-mock-payment-step/spec.md`
- `specs/car-rental-confirmation-and-self-pickup/spec.md`
- `specs/car-rental-credential-highlights/spec.md`
- `tasks.md`

### Deliverables
1. Read-only prefilled payment stage.
2. Deterministic local payment confirmation action.
3. Final confirmation with booking reference + locker ID/PIN instructions.
4. Credential highlights section (name/photo/privileges/expiry etc.).

### Exit criteria
1. Full happy-path journey reaches final confirmation.
2. Payment stage is non-editable.
3. Confirmation includes booking, pickup, and credential highlight sections.

---

## Phase 4 - Demo Reliability Hardening

Change: `openspec/changes/car-rental-demo-reliability`

### Use these artifacts
- `proposal.md`: resilience intent for live demos
- `design.md`: fallback, reset, restore, operator timeline choices
- `specs/car-rental-fallback-and-recovery/spec.md`
- `specs/car-rental-demo-operations/spec.md`
- `tasks.md`

### Deliverables
1. Deterministic fallback mode.
2. Recovery actions for rejected/expired/error verification states.
3. One-step reset/restart flow.
4. Operator timeline and fallback-mode indicator.

### Exit criteria
1. Demo can complete in live mode and fallback mode.
2. Corrupt/stale local state recovers safely.
3. Reset works from any major stage.

---

## Phase 5 - Compliance Guardrails (Final Pass)

Change: `openspec/changes/car-rental-compliance-guardrails`

### Use these artifacts
- `proposal.md`: lightweight guardrails, wow preserved
- `design.md`: minimal but strict semantics and wording rules
- `specs/car-rental-compliance-messaging/spec.md`
- `specs/car-rental-spec-alignment-guardrails/spec.md`
- `tasks.md`

### Deliverables
1. Fresh nonce per authorization request.
2. Correlation validation behavior aligned and consistent.
3. mDL docType/namespace semantics reflected in request modeling.
4. Verification/disclosure wording updated to avoid overclaim while keeping impact.

### Exit criteria
1. No forbidden overclaim text remains.
2. Request semantics remain standards-aligned.
3. UX still feels high-impact and fast.

---

## Sequential Runbook (Per Change)

Use this same runbook for each phase:

1. Read `proposal.md` for scope lock.
2. Read `design.md` for implementation approach.
3. Implement against all `specs/**` requirements.
4. Execute `tasks.md` checkboxes in order.
5. Run smoke validation for changed flow paths.
6. Commit phase changes with clear message.
7. Move to next phase only after exit criteria are met.

## Suggested Validation Depth

Keep validation pragmatic and sequential:

1. Route/state progression checks for current phase.
2. Refresh/restart checks if state logic changed.
3. Full happy path check after Phases 3, 4, and 5.

## Handoff Notes

If delegating sequentially across people:

1. New assignee must start by reading this file and current phase artifacts.
2. No one edits future-phase change artifacts while earlier phase is unstable.
3. If phase scope drifts, update that phase's `proposal/design/specs/tasks` before coding further.
