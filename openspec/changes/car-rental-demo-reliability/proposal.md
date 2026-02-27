## Why

Demo environments are fragile: wallet flows can fail, network can be unreliable, and stale local state can break progression. To keep this demo usable in live meetings and handoffs, we need explicit reliability capabilities including fallback mode, reset paths, and error recovery.

## What Changes

- Add deterministic fallback mode for full demo completion without live dependency success.
- Add reset/restart controls for fast reruns.
- Add reliability requirements for refresh recovery and corrupted local-state handling.
- Add operator traceability requirements (booking/authorizer timeline in local debug context).
- Add required failure-path UX for rejected, expired, and error outcomes.

## Capabilities

### New Capabilities
- `car-rental-fallback-and-recovery`: Defines fallback behavior and recovery from failed/expired verification paths.
- `car-rental-demo-operations`: Defines reset/restart and operator traceability requirements.

### Modified Capabilities
- None.

## Impact

- Affected app area: cross-flow state handling, error screens, and debug/operator utilities.
- Affected runbook quality: enables repeatable demos by non-authors.
- Dependency impact: reliability controls span booking, verification, payment, and confirmation stages.
