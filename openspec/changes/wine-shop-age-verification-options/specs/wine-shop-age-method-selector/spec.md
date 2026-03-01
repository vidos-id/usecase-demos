## ADDED Requirements

### Requirement: Age verification method type

The system SHALL define `AgeVerificationMethod` as a string literal union: `"age_equal_or_over" | "age_in_years" | "birthdate"`. This type SHALL be exported from `verification-types.ts` and used wherever the method is stored or passed.

#### Scenario: Type is defined and exported
- **WHEN** `AgeVerificationMethod` is imported from `verification-types.ts`
- **THEN** it accepts exactly the three values `"age_equal_or_over"`, `"age_in_years"`, and `"birthdate"` and rejects all others at compile time

### Requirement: Age method stored in order state

The `OrderState` SHALL include an `ageVerificationMethod: AgeVerificationMethod | null` field, defaulting to `null`. The order machine SHALL expose a `setAgeVerificationMethod(method: AgeVerificationMethod)` action. The order store SHALL expose this action.

#### Scenario: Default state has no method selected
- **WHEN** a new order is created
- **THEN** `ageVerificationMethod` is `null`

#### Scenario: Method can be set
- **WHEN** `setAgeVerificationMethod("age_in_years")` is called
- **THEN** `orderState.ageVerificationMethod` equals `"age_in_years"`

#### Scenario: Checkout is blocked without a method
- **WHEN** `shippingDestination` is set but `ageVerificationMethod` is `null`
- **THEN** `proceedToCheckout()` returns `{ ok: false }` and navigation to `/checkout` is prevented

### Requirement: Age method selector UI in cart

The cart page SHALL render an "Age Verification Method" section below the shipping destination list. The section SHALL display three selectable cards, one per `AgeVerificationMethod` value. Each card SHALL show a short label and a privacy-implication subtitle. Selection SHALL follow the same visual pattern as destination cards (radio indicator, left accent border when selected).

The three options SHALL be presented as:

| Value | Label | Subtitle |
|---|---|---|
| `age_equal_or_over` | Privacy-First | "Share only a yes/no confirmation — no personal data disclosed" |
| `age_in_years` | Age Only | "Share your age in years — no birth date disclosed" |
| `birthdate` | Full Birth Date | "Share your complete birth date for maximum compatibility" |

#### Scenario: All three options are rendered
- **WHEN** the cart page renders with items in the cart
- **THEN** exactly three age method option cards are visible

#### Scenario: No option is pre-selected
- **WHEN** the cart page first renders
- **THEN** no age method card shows the selected state

#### Scenario: Selecting an option updates order state
- **WHEN** the user clicks the "Age Only" card
- **THEN** that card enters the selected visual state and `orderState.ageVerificationMethod` equals `"age_in_years"`

#### Scenario: Checkout button requires method selection
- **WHEN** a destination is selected but no age method is selected
- **THEN** the "Proceed to Checkout" button is disabled

#### Scenario: Checkout button enables when both are selected
- **WHEN** both a destination and an age method are selected
- **THEN** the "Proceed to Checkout" button is enabled
