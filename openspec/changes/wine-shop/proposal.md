## Why

Demonstrate age-gated e-commerce using verifiable credentials — a use case immediately understandable to any investor audience. A simplified online wine shop lets a customer browse products, add to cart, select a shipping destination, and complete checkout by presenting a **PID** (age/identity proof) from their EU Digital Identity Wallet. The age-gate clause — rejecting underage buyers based on the destination country's legal drinking age (EU: 18+, US: 21+) — provides the "wow moment" parallel to the car-rental licence-category mismatch. The same person with the same credential can get different outcomes depending on where they ship.

## What Changes

- New frontend-only use case app at `usecases/wine-shop/`.
- Wine product catalog with age-restricted items.
- Shipping destination selection with pre-filled addresses (EU and US), determining the applicable legal drinking age (EU: 18+, US: 21+).
- Cart and checkout flow culminating in wallet-based identity verification.
- Age eligibility check: birth date from PID evaluated against the shipping destination's legal drinking age. Underage → purchase blocked with clear rejection UI.
- Mock payment step (same pattern as car-rental: pre-filled, non-editable card).
- Order confirmation showing credential highlights (name, age verification result, portrait if available).
- Unique visual design — wine/commerce theme, distinct from car-rental.
- Integration with Vidos Authorizer via the same authorization + polling + policy-response + credentials pattern.

## Capabilities

### New Capabilities

- `wine-shop-catalog`: Product catalog with wine items, shipping destination selection (with country-based age thresholds), cart management, and order state.
- `wine-shop-verification`: Credential request (PID via DCQL), age eligibility check, and verification lifecycle.
- `wine-shop-checkout`: Payment mock, order confirmation, credential highlights display, and rejection/success flows.

### Modified Capabilities

_(none — this is an entirely new use case app)_

## Impact

- New workspace: `usecases/wine-shop/` (Vite + React + TanStack Router + Tailwind + shadcn/ui — same stack as car-rental).
- New entry in the home navigator (`usecases-home/`) linking to the wine shop demo.
- Authorizer integration: reuses existing Vidos Authorizer REST API pattern (`/openid4/vp/v1_0/authorizations`). No authorizer changes needed.
- Credentials consumed: **PID** (SD-JWT VC or MSO Mdoc) for `birth_date`, `given_name`, `family_name`, `portrait`.
- No backend, no database, no real payment processing.
