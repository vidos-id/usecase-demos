## ADDED Requirements

### Requirement: Age restriction rejection UI

When verification succeeds but the age check fails, the system SHALL display an `AgeRestrictionRejection` panel showing: the required age, the buyer's actual age, and guidance text. The panel SHALL clearly communicate that the purchase cannot proceed due to age restrictions. The payment step SHALL be blocked.

#### Scenario: Underage buyer sees rejection
- **WHEN** verification lifecycle is `success` AND `ageCheck.eligible` is `false`
- **THEN** the system displays the age restriction rejection panel with the destination's required age, the buyer's actual age, and the destination name
- **AND** the "Proceed to Payment" action is disabled or hidden

#### Scenario: Eligible buyer proceeds
- **WHEN** verification lifecycle is `success` AND `ageCheck.eligible` is `true`
- **THEN** the system displays a success banner and enables the "Proceed to Payment" action

### Requirement: Verification blocked states UI

When verification results in `rejected`, `expired`, or `error`, the system SHALL display a blocked panel with the failure reason and offer retry/reset actions.

#### Scenario: Verification rejected
- **WHEN** the authorizer policy rejects the presentation
- **THEN** the system displays a rejection message with a "Try Again" action

#### Scenario: Verification expired
- **WHEN** the verification session times out
- **THEN** the system displays an expiry message with a "Start New Verification" action

### Requirement: Mock payment step

The system SHALL display a pre-filled, non-editable payment card section. Card details SHALL be hardcoded display values. The user SHALL confirm payment with a single action. The payment step SHALL only be reachable when verification succeeded and age check passed. A visible label SHALL indicate this is a simulated payment.

#### Scenario: Payment card displayed
- **WHEN** user reaches the payment step
- **THEN** a pre-filled payment card is displayed with non-editable fields and a "Confirm Order" button

#### Scenario: Payment confirmation
- **WHEN** user clicks "Confirm Order"
- **THEN** the order transitions to `payment_confirmed` and the user is navigated to the confirmation page

#### Scenario: Direct payment access blocked
- **WHEN** user navigates directly to the payment route without a verified order
- **THEN** the system redirects to the appropriate earlier step

### Requirement: Order confirmation page

The confirmation page SHALL display: order reference number, order summary (items, quantities, total), shipping destination, credential highlights (full name, age verification result, portrait if available), and a delivery note. The credential highlights section SHALL use wording consistent with selective disclosure principles (e.g., "Wallet disclosed the requested attributes").

#### Scenario: Confirmation displays order and credential data
- **WHEN** user reaches the confirmation page after payment
- **THEN** the system displays the order reference, item summary, total, and a credential highlights section with the buyer's name and age verification status

#### Scenario: Portrait displayed when available
- **WHEN** the disclosed claims include a portrait
- **THEN** the confirmation page displays the portrait image in the credential highlights section

#### Scenario: Portrait absent
- **WHEN** the disclosed claims do not include a portrait
- **THEN** the credential highlights section omits the photo without layout breakage

### Requirement: Demo reset

The system SHALL provide a mechanism to reset the entire demo state (order, cart, verification) from any point in the flow. After reset, the user SHALL be returned to the landing page with an empty cart.

#### Scenario: Reset from confirmation
- **WHEN** user triggers demo reset from the confirmation page
- **THEN** all state is cleared and the user is navigated to the landing page

#### Scenario: Reset from verification
- **WHEN** user triggers demo reset during verification
- **THEN** all state is cleared, any active polling is stopped, and the user is navigated to the landing page
