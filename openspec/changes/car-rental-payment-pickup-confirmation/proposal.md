## Why

After verification, the demo still needs a complete rental finish that feels real to end users. A mocked but polished payment step and a strong confirmation screen with self-pickup instructions are required to show that mDL+PID verification leads directly to successful rental completion.

## What Changes

- Add a mock payment stage with prefilled, non-editable card presentation.
- Add deterministic local confirmation action to progress to booking completion.
- Add final confirmation capability with booking details, self-pickup locker instructions, and disclosed credential highlights.
- Add eligibility interpretation output based on verification policy outcomes.

## Capabilities

### New Capabilities
- `car-rental-mock-payment-step`: Defines display-only payment UX and progression behavior.
- `car-rental-confirmation-and-self-pickup`: Defines completion UX with booking reference, locker ID/PIN, and pickup instructions.
- `car-rental-credential-highlights`: Defines required displayed credential highlights on confirmation.

### Modified Capabilities
- None.

## Impact

- Affected app area: payment and confirmation stages in `usecases/car-rental/`.
- Affected UX narrative: transforms verification result into complete rental experience.
- Dependency impact: requires verification result model from prior verification change.
