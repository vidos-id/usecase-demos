## Context

This is the core technical and product moment: request PID + mDL via DCQL, correlate the verifier transaction with rental booking context, and surface policy/disclosed data clearly. The app is frontend-only, so it must rely on authorizer outputs while still preserving strong lifecycle and data semantics.

## Goals / Non-Goals

**Goals:**
- Define one coherent dual-credential verification flow for PID + mDL.
- Correlate `authorizerId` with `bookingId` across app lifecycle.
- Normalize policy results and disclosed claims into stable UI model.
- Support pending/success/rejected/expired/error states with clear progression rules.

**Non-Goals:**
- Re-implementing cryptographic verification logic in browser.
- Supporting arbitrary credential types beyond PID + mDL for MVP.
- Building server-managed authorization orchestration in this change.

## Decisions

### 1) Request PID and mDL in one DCQL verifier transaction
Decision:
- Build a single request containing two credential entries and consistent IDs for response mapping.

Rationale:
- Mirrors intended real-world rental flow and avoids split-step complexity.

Alternative considered:
- Two sequential verifier requests.

Why not:
- Slower UX and more failure points; weaker demo narrative.

### 2) Use `authorizerId` as the canonical verification anchor
Decision:
- Persist `authorizerId` and bind it to `bookingId` as primary correlation key.

Rationale:
- Aligns with how policy results and submitted credentials are retrieved.

Alternative considered:
- Route-only transient identifiers.

Why not:
- Breaks on refresh and weakens traceability.

### 3) Normalize disclosed data into view-focused schema
Decision:
- Keep a normalized data model for displayed PID/mDL fields, with optional raw payload for developer detail panels.

Rationale:
- Stable UI behavior and easier delegation.

Alternative considered:
- Render directly from raw authorizer response each time.

Why not:
- Brittle and hard to maintain when payload shapes evolve.

### 4) Gate progression on policy outcome
Decision:
- Only successful verification can unlock payment step unless explicit demo fallback mode is active.

Rationale:
- Preserves logical integrity of “verified before rent” experience.

Alternative considered:
- Allow progression regardless of status for convenience.

Why not:
- Undermines core use-case credibility.

## Risks / Trade-offs

- [External dependency latency can stall UX] -> Mitigation: explicit lifecycle states and timeout handling.
- [Missing optional claims create uneven UI] -> Mitigation: normalized optional fields + graceful placeholders.
- [Correlation mismatch can orphan bookings] -> Mitigation: strict binding validation between `bookingId` and `authorizerId`.

## Migration Plan

1. Define DCQL request model with PID/mDL credential IDs.
2. Implement verifier-session bootstrap and `authorizerId` persistence.
3. Implement lifecycle transitions and UI states.
4. Implement policy/disclosed-data normalization.
5. Validate progression rules into payment step.

Rollback:
- Fall back to mocked verification result path while retaining booking continuity.

## Open Questions

- None.
