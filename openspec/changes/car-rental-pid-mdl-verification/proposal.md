## Why

The core value of this demo is proving that rental eligibility can be established from wallet-presented PID + mDL data using Vidos Authorizer. Without a clearly specified dual-credential verification capability (including policy results and disclosed-claim handling), the demo cannot showcase the intended business and developer outcomes.

## What Changes

- Add verifier flow capability that requests both PID and mDL credentials in one DCQL-driven journey.
- Add correlation model linking `authorizerId` to `bookingId` for traceability.
- Add verification lifecycle states (pending, processing, success, rejected, expired, error).
- Add policy-result consumption and disclosed-claim normalization for UI display.
- Add local persistence/rehydration requirements for verification context and outcomes.

## Capabilities

### New Capabilities
- `car-rental-pid-mdl-verification`: Defines DCQL-based dual credential request flow and verification lifecycle.
- `car-rental-authorizer-correlation`: Defines correlation and persistence rules for `authorizerId` and booking linkage.
- `car-rental-policy-and-disclosed-data`: Defines policy result handling and disclosed-claim normalization for rental UX.

### Modified Capabilities
- None.

## Impact

- Affected app area: verification step UI and booking-to-verification navigation.
- Affected integration layer: authorizer session handling, result retrieval, and state persistence.
- Affected final experience: credential highlights and eligibility outcomes on later confirmation screens.
