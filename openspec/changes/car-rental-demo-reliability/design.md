## Context

The demo must remain usable under live conditions where wallet handoff, network timing, or local state can fail. This change adds reliability behavior across the whole journey so presenters can always complete the story and restart quickly.

## Goals / Non-Goals

**Goals:**
- Provide deterministic fallback mode for full flow completion.
- Ensure refresh recovery and safe handling of corrupted local state.
- Add fast reset/restart controls for repeated demos.
- Provide minimal operator traceability for troubleshooting during live sessions.

**Non-Goals:**
- Production observability stack, centralized logging, or incident tooling.
- Multi-device session synchronization.
- Persistent backend audit logs.

## Decisions

### 1) Add explicit demo fallback mode
Decision:
- Implement a clearly marked fallback path that simulates verification success/failure states deterministically.

Rationale:
- Prevents external dependency outages from blocking demos.

Alternative considered:
- Live dependency only.

Why not:
- Too fragile for high-stakes presentation contexts.

### 2) Treat local persistence as recoverable cache, not source of truth
Decision:
- On parse/schema mismatch, safely discard broken records and route user to restart.

Rationale:
- Protects against app breakage from stale or corrupted browser data.

Alternative considered:
- Hard-fail on malformed storage.

Why not:
- Creates dead ends and operator friction.

### 3) Provide one-step reset controls
Decision:
- Offer a fast reset action that clears local state and returns to initial flow.

Rationale:
- Enables quick reruns between meetings/users.

Alternative considered:
- Manual multi-step reset.

Why not:
- Too slow and error-prone during live operation.

### 4) Add lightweight operator timeline
Decision:
- Keep local timeline of booking + authorizer lifecycle milestones for current demo session.

Rationale:
- Helps diagnose where flow failed without heavy tooling.

Alternative considered:
- No operator traceability.

Why not:
- Harder to recover quickly when failures occur.

## Risks / Trade-offs

- [Fallback mode can be confused with live mode] -> Mitigation: persistent and visible fallback indicator.
- [Aggressive reset may remove useful context] -> Mitigation: optional confirm step and clear labeling.
- [Traceability UI can clutter product flow] -> Mitigation: keep operator timeline tucked behind optional panel.

## Migration Plan

1. Define fallback mode behaviors and status outputs.
2. Add storage resilience and recovery rules.
3. Add reset action and restart flow wiring.
4. Add operator timeline view and event capture points.
5. Validate full journey in live and fallback modes.

Rollback:
- Disable operator timeline and fallback controls independently if they introduce instability.

## Open Questions

- None.
