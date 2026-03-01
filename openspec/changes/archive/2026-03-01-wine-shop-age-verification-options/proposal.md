## Why

The wine shop currently only requests the `age_equal_or_over` boolean claim for age verification. While privacy-preserving, it offers no flexibility — users cannot choose to share richer age data (e.g. age in years or birth date) if they prefer or if downstream logic requires it. Adding selectable verification methods gives users agency over how much personal data they disclose.

## What Changes

- Add a UI control at the address selection step that lets users choose their preferred age verification method before requesting credentials
- Three options: age_equal_or_over (privacy-first, boolean), age_in_years (share age only), birthdate (share full birth date)
- The DCQL credential request is built dynamically based on the selected option
- Age eligibility check logic is extended to handle all three claim types: boolean flag, numeric age, and ISO date string

## Capabilities

### New Capabilities
- `wine-shop-age-method-selector`: UI component shown alongside address selection allowing the user to pick their preferred age disclosure method (privacy-first / age only / full birth date), with clear labels explaining the privacy tradeoff of each option.

### Modified Capabilities
- `wine-shop-verification`: Age eligibility check requirement changes — must now support deriving eligibility from `age_equal_or_over.18`, `age_equal_or_over.21`, `age_in_years`, or `birthdate` claim depending on which method was selected. DCQL query requirement changes — claims requested depend on the selected method instead of always requesting `birthdate`.

## Impact

- `usecases/wine-shop/src/` — verification flow, DCQL query builder, age check logic, address/checkout step UI
- No backend changes; DCQL is client-side constructed
- No new dependencies expected
