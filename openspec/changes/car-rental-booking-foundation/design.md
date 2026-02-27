## Context

The car-rental demo must feel like a real consumer booking site before credential verification starts. If the verifier flow appears before a concrete booking context exists, the identity step feels artificial and weakens both business and developer storytelling.

This change defines the booking foundation: search/select/review, booking lifecycle, and persistence rules that downstream verification/payment/confirmation changes depend on.

## Goals / Non-Goals

**Goals:**
- Define a deterministic booking state machine from initial search through verification handoff.
- Ensure `bookingId` is created before verification and is available for cross-step correlation.
- Make booking progress resilient to refresh via local persistence.
- Keep the model simple enough for frontend-only execution and delegation.

**Non-Goals:**
- Dynamic pricing engines or real inventory backends.
- Advanced upsell flows (insurance bundles, loyalty pricing, etc.).
- Multi-user collaboration, account management, or server persistence.

## Decisions

### 1) Use an explicit booking lifecycle model
Decision:
- Define a finite set of states (draft, reviewed, awaiting_verification, verified, payment_confirmed, completed, failed) with allowed transitions.

Rationale:
- Prevents invalid progression and simplifies handoff to other teams.

Alternative considered:
- Loose boolean flags across screens.

Why not:
- Flag combinations become inconsistent and hard to reason about.

### 2) Create booking context before verification step
Decision:
- Verification route requires a valid booking snapshot and generated `bookingId`.

Rationale:
- Enables traceability and maps directly to authorizer correlation in later changes.

Alternative considered:
- Create booking only after verification succeeds.

Why not:
- Breaks “real car-rental” feeling and weakens final confirmation continuity.

### 3) Persist booking state locally with restore behavior
Decision:
- Persist only required booking fields and current lifecycle state in local storage.

Rationale:
- Supports refresh recovery without backend complexity.

Alternative considered:
- In-memory only.

Why not:
- Refresh would reset flow and hurt demo reliability.

### 4) Keep booking data model minimal but extensible
Decision:
- Include only fields needed for UX and downstream verifier/payment/confirmation steps.

Rationale:
- Reduces implementation noise while preserving future extension path.

Alternative considered:
- Full production-level booking schema.

Why not:
- Unnecessary complexity for demo objective.

## Risks / Trade-offs

- [State transition bugs can block user flow] -> Mitigation: central transition guards and scenario checks for each transition.
- [Local storage can become stale/corrupt] -> Mitigation: schema versioning + safe reset path when parsing fails.
- [Too little booking detail can feel fake] -> Mitigation: include realistic core fields (location, dates, vehicle, pricing summary).

## Migration Plan

1. Introduce booking state model and transition rules.
2. Implement search/select/review views wired to the model.
3. Add booking context creation + `bookingId` generation.
4. Add local persistence and rehydration behavior.
5. Validate end-to-end handoff into verification route.

Rollback:
- Revert to in-memory-only booking and direct routing if state model introduces instability.

## Open Questions

- None.
