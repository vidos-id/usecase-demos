## Purpose

Compact Vinos-branded ChatGPT UI for QR code presentation, lightweight verification status display, and immediate post-verification checkout fallback.

## ADDED Requirements

### Requirement: Compact Vinos checkout widget

The system SHALL register a ChatGPT-compatible static UI resource template that renders the verification QR code, lightweight verification context, and Vinos branding for the active checkout session. The widget SHALL render from tool output delivered into the ChatGPT iframe and SHALL not be required for browsing wines, selecting products, or narrating the broader purchase flow.

#### Scenario: Widget shown for verification step
- **WHEN** checkout enters the verification-required state
- **THEN** the system provides a widget resource template plus tool output data that display the QR code and minimal verification context

#### Scenario: Widget uses Vinos branding
- **WHEN** the widget is rendered in ChatGPT
- **THEN** it presents Vinos-specific branding cues such as the Vinos logo, Vinos naming, and wine-shop-aligned visual styling

#### Scenario: Product flow stays in chat
- **WHEN** the user browses wines or asks for recommendations
- **THEN** the system keeps those interactions in normal chat text rather than requiring a custom product UI

### Requirement: ChatGPT widget metadata for submission and rendering

The widget resource SHALL include ChatGPT-compatible metadata for output-template rendering and app submission. This SHALL include the MCP Apps resource URI, widget CSP metadata, widget domain metadata, and output-template linkage from the checkout tool.

#### Scenario: Widget metadata provided
- **WHEN** ChatGPT reads the widget resource and tool descriptor
- **THEN** it receives the resource URI linkage plus CSP/domain metadata needed for rendering and app submission

### Requirement: Lightweight status visibility

The widget SHALL display a compact view centered on the QR code and minimal verification instructions. Any richer success/failure or low-level authorization state SHALL remain primarily available through agent text and tool data rather than adding a heavy status UI.

#### Scenario: Pending authorization state displayed
- **WHEN** verification is awaiting wallet interaction or processing
- **THEN** the widget shows the QR code and minimal verification guidance while the agent/tool responses carry the richer status details

#### Scenario: Terminal state displayed compactly
- **WHEN** verification reaches a terminal state
- **THEN** the widget can remain minimal without taking over the success or failure narration from the agent

### Requirement: Post-verification payment fallback

When age verification succeeds, the widget SHALL stop showing the QR code and wallet-launch affordances. The widget SHALL instead reveal a compact Vinos payment step and final success state so the demo can still complete even if the agent does not immediately continue in chat.

#### Scenario: QR affordances hidden after verification
- **WHEN** the widget observes a verified checkout state
- **THEN** it hides the QR code and wallet action and no longer suggests that scanning is still required

#### Scenario: Payment fallback shown after verification
- **WHEN** the widget observes a verified checkout state
- **THEN** it shows a compact payment form with realistic prefilled card details and a checkout action

#### Scenario: Payment success replaces form
- **WHEN** the user completes the in-widget payment step
- **THEN** the widget hides the payment form and shows a success confirmation that the Vinos order is confirmed and shipping will begin as soon as possible

### Requirement: Widget-driven continuation into chat

The widget SHALL be able to call the verification-status MCP tool while it is mounted and SHALL trigger a ChatGPT follow-up message when verification reaches a terminal state. This follow-up SHALL give the agent a fresh turn so it can continue the checkout conversation automatically.

#### Scenario: Widget polls for status updates
- **WHEN** the QR widget is mounted for an active checkout session
- **THEN** it periodically calls the checkout-status tool and updates its compact status view without requiring user intervention

#### Scenario: Agent resumes after successful verification
- **WHEN** the widget observes a successful terminal verification state
- **THEN** it sends a host follow-up message that causes the agent to resume the conversation and proceed with checkout guidance

### Requirement: Agent remains the primary narrator

The system SHALL return tool outputs that allow the agent itself to explain verification success or failure in chat. The widget SHALL remain supplemental and SHALL not be the only surface communicating the result.

#### Scenario: Success communicated by agent
- **WHEN** verification succeeds
- **THEN** the agent can report success in chat using the returned status and age-check details

#### Scenario: Failure communicated by agent
- **WHEN** verification fails, expires, or is rejected
- **THEN** the agent can report the failure reason and next step in chat using the returned verification summary
