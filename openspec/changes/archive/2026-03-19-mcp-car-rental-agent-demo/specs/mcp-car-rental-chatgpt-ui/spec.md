## ADDED Requirements

### Requirement: Single MCP App resource for the booking journey

The MCP package SHALL register one MCP App resource for the car-rental journey and bind it to tool results through `_meta.ui.resourceUri`. The resource SHALL be used only for verification and post-verification success or confirmation states.

#### Scenario: Verification tool opens the rental widget
- **WHEN** booking enters the verification step
- **THEN** the returned tool result references the car-rental MCP App resource and provides structured content for the verification view

#### Scenario: Widget changes mode as booking progresses
- **WHEN** the booking snapshot changes from verification to proof-success or confirmation
- **THEN** the same MCP App resource renders the corresponding view mode without requiring a different resource registration

### Requirement: Verification widget flow

The MCP App resource SHALL render a verification state with QR or wallet-launch affordances when booking requires credential presentation. The widget SHALL poll booking or verification state through server tools until a terminal result is reached.

#### Scenario: Verification view shows wallet handoff
- **WHEN** booking requires verification
- **THEN** the widget displays the authorization handoff needed for wallet presentation together with current status messaging

#### Scenario: Widget polling stops on terminal state
- **WHEN** verification becomes `success`, `rejected`, `expired`, or `error`
- **THEN** the widget stops polling the server for further pending-state updates

### Requirement: High-visibility proof-success presentation

After successful driving-licence verification, the MCP App resource SHALL show an obvious success state that highlights what was verified for the audience. The success presentation SHALL make the accepted licence proof visually clear before or alongside the final booking handoff.

#### Scenario: Success state highlights received licence proof
- **WHEN** verification succeeds
- **THEN** the widget prominently shows that the driving licence was accepted together with the key licence details relevant to the selected vehicle

### Requirement: Text fallback remains available

Every tool that drives the MCP App resource SHALL also return plain text content that explains the current state in non-UI hosts.

#### Scenario: Non-UI host still receives usable output
- **WHEN** the MCP App resource cannot be rendered
- **THEN** the user still receives a text description of search results, verification state, or booking outcome
