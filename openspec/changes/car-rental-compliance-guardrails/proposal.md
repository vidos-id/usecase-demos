## Why

This demo references regulated identity standards and still needs to keep a strong wow factor. We need lightweight guardrails so the product stays spec-aligned (OpenID4VP/DCQL, ISO 18013-5 semantics) without making the experience feel constrained or over-explained.

## What Changes

- Add normative compliance requirements for verifier request correlation, nonce handling, and DCQL credential mapping.
- Add normative requirements for mDL doc type and namespace semantics used in query representation.
- Add UX copy requirements distinguishing disclosed/presented claims from cryptographic verification claims.
- Add prohibited claim rules to prevent overstating trust guarantees in frontend-only mode.

## Capabilities

### New Capabilities
- `car-rental-compliance-messaging`: Defines allowed and forbidden verification/disclosure wording in UX.
- `car-rental-spec-alignment-guardrails`: Defines standards-aligned requirements for request semantics and mDL identifiers.

### Modified Capabilities
- None.

## Impact

- Affected app area: verification and confirmation copy/content.
- Affected stakeholder trust: reduces legal/credibility risk in demos.
