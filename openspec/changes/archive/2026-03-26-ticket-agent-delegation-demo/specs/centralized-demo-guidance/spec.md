## Purpose

Add ticket agent demo entry to the home navigator use case grid.

## MODIFIED Requirements

### Requirement: Use case grid showcases all live demos

The use case grid SHALL include the ticket agent demo as a showcase entry. The entry SHALL have: title "Event Tickets with Agent Delegation", category "Consumer", credential pills showing "PID" and "Delegation Credential", an `appUrl` linking to the deployed ticket agent web app, and an AI guide configuration pointing to the OpenClaw agent flow. The entry SHALL appear alongside the existing wine shop, car rental, and demo bank entries.

#### Scenario: Ticket agent appears in use case grid
- **WHEN** the home navigator loads
- **THEN** the use case grid SHALL include the ticket agent demo entry with the correct title, category, and credential pills

#### Scenario: Ticket agent links to web app
- **WHEN** the user clicks the ticket agent "Open web app" link
- **THEN** it SHALL navigate to the deployed ticket agent delegation portal

#### Scenario: Ticket agent AI guide available
- **WHEN** the user clicks the ticket agent AI guide button
- **THEN** it SHALL navigate to an OpenClaw agent guide page for the ticket agent

### Requirement: Ticket agent guide page with chat mockup

The home navigator SHALL include an agent guide page for the ticket agent demo at a dedicated route. The guide page SHALL include an animated chat mockup component (following the pattern of `chatgpt-wine-mockup.tsx` and `chatgpt-car-rental-mockup.tsx`) that demonstrates the agent delegation flow. The mockup SHALL show: (1) agent initializing wallet and providing public key, (2) user providing delegation credential, (3) agent importing credential, (4) agent browsing events, (5) agent creating a booking, (6) agent autonomously presenting credential via wallet-cli (no QR code — this is different from the wine and car rental mockups), (7) booking confirmation. The mockup SHALL use the `animated-chat-mockup` component with appropriate state transitions and step timings.

#### Scenario: Chat mockup renders delegation flow
- **WHEN** the agent guide page is viewed
- **THEN** the animated chat mockup SHALL play through the delegation and booking flow automatically

#### Scenario: Mockup shows autonomous credential presentation
- **WHEN** the mockup reaches the verification step
- **THEN** it SHALL show a tool-call style step for `wallet-cli present` instead of a QR code widget (unlike wine and car rental mockups)
