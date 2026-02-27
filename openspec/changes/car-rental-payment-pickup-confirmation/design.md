## Context

The demo must end like a real rental: after verification, the user confirms payment and receives pickup instructions. This change defines the completion experience while keeping payment intentionally mocked and deterministic.

## Goals / Non-Goals

**Goals:**
- Provide a polished, read-only payment stage that looks real and is fast to complete.
- Deliver a strong final confirmation with booking info, locker pickup instructions, and credential highlights.
- Keep progression deterministic and local for stable demo delivery.

**Non-Goals:**
- Real payment authorization, settlement, or fraud controls.
- Editable checkout forms and card validation flows.
- Physical pickup counter reverification.

## Decisions

### 1) Make payment step display-only
Decision:
- Show prefilled card details in a locked presentation component with no editable fields.

Rationale:
- Keeps focus on identity flow while preserving realistic checkout aesthetics.

Alternative considered:
- Editable mock card form.

Why not:
- Adds unnecessary friction and complexity for demo.

### 2) Use a deterministic local payment confirmation action
Decision:
- A single confirm action transitions state to payment-confirmed without external calls.

Rationale:
- Ensures stable end-to-end behavior in live demos.

Alternative considered:
- Simulated async gateway with random failures.

Why not:
- Introduces avoidable demo instability.

### 3) Build confirmation page around three blocks
Decision:
- Confirmation layout is organized into booking summary, credential highlights, and self-pickup instructions.

Rationale:
- Makes completion outcome immediately clear to both business and developer viewers.

Alternative considered:
- Single generic success banner.

Why not:
- Misses the wow effect and loses key proof points.

### 4) Derive eligibility text from policy outcomes
Decision:
- Display a concise eligibility statement sourced from verification status and policy summary.

Rationale:
- Connects identity proof directly to rental authorization decision.

Alternative considered:
- Static success copy regardless of policy details.

Why not:
- Weakens credibility of the verification story.

## Risks / Trade-offs

- [Mock payment may be mistaken as real] -> Mitigation: explicit simulated-payment copy.
- [Confirmation can become too dense] -> Mitigation: prioritize key fields and clear visual hierarchy.
- [Missing portrait/driving fields can reduce impact] -> Mitigation: conditional rendering with fallback labels.

## Migration Plan

1. Define payment-confirmation lifecycle transition.
2. Implement read-only payment component and confirm action.
3. Implement confirmation screen with booking + credentials + pickup modules.
4. Wire eligibility statement to policy outcomes.

Rollback:
- Skip payment screen and route directly to confirmation if needed for demo stability.

## Open Questions

- None.
