## ADDED Requirements

### Requirement: Agent-driven booking completion

The system SHALL produce a final booking-completion state only after verification approves the selected rental. The model-visible completion output SHALL let the agent congratulate the user, confirm the selected car, and describe the successful booking outcome.

#### Scenario: Approved booking reaches completion
- **WHEN** verification approves the selected rental
- **THEN** the booking state becomes eligible for completion messaging and confirmation output

#### Scenario: Rejected booking does not complete
- **WHEN** verification ends in rejection, expiry, or error
- **THEN** the system MUST NOT generate a successful booking completion message

### Requirement: Fake pickup fulfillment details

For approved bookings, the system SHALL generate deterministic fake pickup fulfillment details for demo use. The fulfillment payload SHALL include a booking reference, a pickup location or zone, a locker or keybox identifier, a PIN or access code, and a short pickup instruction.

#### Scenario: Success includes locker handoff
- **WHEN** the booking is approved
- **THEN** the completion payload includes fake locker or key pickup details that the agent can narrate to the user

#### Scenario: Pickup details are stable within one booking
- **WHEN** the booking confirmation is fetched again for the same approved booking session
- **THEN** the same booking reference and pickup details are returned

### Requirement: Confirmation data is shared between agent and widget

The system SHALL expose the same confirmation payload to both the model-facing tool responses and the MCP App resource so the text transcript and widget stay consistent.

#### Scenario: Agent and widget show the same confirmed vehicle
- **WHEN** a booking reaches confirmation
- **THEN** both the widget confirmation state and the agent-facing response identify the same vehicle and booking reference

#### Scenario: Confirmation includes verification context
- **WHEN** a booking reaches confirmation
- **THEN** the confirmation payload includes a concise summary of the successful verification outcome alongside the pickup handoff details

### Requirement: Verification success stays demo-visible

The system SHALL preserve a visibly impressive proof-success moment for approved bookings so investors can clearly see that driving-licence verification happened. The booking flow SHALL keep the success context visible in the widget even after the agent posts the completion message.

#### Scenario: Widget remains visibly successful after approval
- **WHEN** the booking is approved and the agent posts the completion response
- **THEN** the widget continues showing the verification-success state together with the confirmation context instead of disappearing immediately
