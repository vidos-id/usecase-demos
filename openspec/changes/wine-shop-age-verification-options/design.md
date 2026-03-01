## Context

The wine shop verification flow is a client-side React app. The DCQL query is built in `authorizer-client.ts:buildCreateAuthorizationBody` and always requests the single claim `age_equal_or_over.<requiredAge>`. The verification store (`verification-store.tsx`) initiates the session and calls `checkAgeEligibility` after credentials are returned. The age check already handles all three claim types (`ageEqualOrOver`, `ageInYears`, `birthDate`) defensively — no change needed there.

The user's age disclosure preference must be captured before the verification session starts so the DCQL query can reflect it. The natural moment for this choice is the cart/address page, alongside destination selection — both decisions affect what gets requested from the wallet.

## Goals / Non-Goals

**Goals:**
- Let users select one of three age disclosure methods before starting verification
- Pass the selected method into `buildCreateAuthorizationBody` so the DCQL claims are determined by the selection
- Store the selected method in order state so it is available when the verification session starts
- Present the options with clear, user-friendly privacy-tradeoff labels in the cart UI

**Non-Goals:**
- Changing the wallet presentation protocol (OID4VP/DCQL) — only the claim selection changes
- Per-destination method defaults or restrictions
- Persisting the method preference across sessions
- Validating that the wallet can satisfy the requested claim type

## Decisions

### Decision 1: Store selected method in order state (not verification state)

The method is chosen at the cart step, before verification begins. Order state already holds `shippingDestination`, which is also set at this step. Adding `ageVerificationMethod` to `OrderState` keeps the two co-located selection parameters together and makes them available together when checkout begins.

**Alternative**: Store in local component state in `CartPage` and thread via checkout navigation params. Rejected — fragile across re-renders and harder to reset.

### Decision 2: Add `ageVerificationMethod` field to `OrderState`

New optional field `ageVerificationMethod: AgeVerificationMethod | null` on `OrderState` (default `null` — meaning "not yet selected"). The checkout button remains disabled until both `shippingDestination` and `ageVerificationMethod` are set.

**Alternative**: Default to `age_equal_or_over` if not set. Rejected — explicit user choice is the point; defaulting defeats the purpose and hides the feature.

### Decision 3: DCQL claim selection is a pure mapping in `buildCreateAuthorizationBody`

The function signature gains `ageVerificationMethod: AgeVerificationMethod` alongside `requiredAge: number`. A simple switch maps the method to the appropriate claims array:
- `age_equal_or_over` → `[{ path: ["age_equal_or_over", String(requiredAge)] }]`
- `age_in_years` → `[{ path: ["age_in_years"] }]`
- `birthdate` → `[{ path: ["birthdate"] }]`

All three are included in one credential entry (as the user-provided DCQL example shows), but only the matching claim path is requested. This keeps the credential ID stable (`age-<age>-pid-cred`) for all methods.

**Alternative**: Request all three claims always, letting the wallet decide. Rejected — defeats privacy-focused design; the whole point is to request only what is needed.

### Decision 4: Method selector UI placed directly below the address list in `CartPage`

The selector appears as a visually grouped section between "Shipping Destination" and the total/CTA card. It uses the same selection card pattern as destination cards (radio-button-style, left accent border on selection). This is consistent with existing design vocabulary.

**Alternative**: Modal or inline on the checkout page. Rejected — the method is logically a pre-flight configuration choice, not a mid-flow decision.

### Decision 5: `AgeVerificationMethod` is a discriminated union string literal type

```ts
type AgeVerificationMethod = "age_equal_or_over" | "age_in_years" | "birthdate"
```

Defined in `verification-types.ts`. Shared between order types (for storage) and the authorizer client (for DCQL building).

## Risks / Trade-offs

- **Wallet compatibility**: A wallet may not have the requested claim (e.g., `age_in_years`). The authorizer will reject the presentation and the user sees the normal rejected/error UI. No new error handling needed; existing recovery flow handles it. Mitigation: consider adding a note in the selector UI that the option depends on wallet support.
- **`birthdate` vs `birth_date`**: The PID spec uses `birthdate` (no underscore) for the SD-JWT VC claim path. The existing `NormalizedPidClaims.birthDate` field maps from whichever claim name the wallet returns. Confirm the path key matches the Vidos authorizer DCQL expectation exactly.
