## Why

The car-rental demo needs a realistic booking journey before any credential verification happens, otherwise the wallet step feels disconnected and the demo does not reflect real rental UX. We need a stable booking foundation that always creates a valid booking context to anchor verification and final confirmation.

## What Changes

- Add a complete booking journey capability for search, vehicle selection, and booking review.
- Require creation of a booking context (`bookingId` + rental details) before verification can start.
- Add booking lifecycle rules and transition guards so invalid/incomplete bookings cannot proceed.
- Add local persistence and restore behavior for in-progress booking flows.

## Capabilities

### New Capabilities
- `car-rental-booking-journey`: Defines booking UX, booking state model, and progression rules from search through review.

### Modified Capabilities
- None.

## Impact

- Affected app area: `usecases/car-rental/` client routes/pages for search, vehicle selection, and booking review.
- Affected state layer: global booking state, lifecycle transitions, and local persistence/rehydration behavior.
- Dependency impact: this capability is a prerequisite for verification, payment, and confirmation capabilities.
