## ADDED Requirements

### Requirement: Shared rental catalog package

The system SHALL keep reusable car-rental resources in a shared package within `usecases/car-rental/` that is consumed by both the `web` package and the `mcp` package. The shared package SHALL be the source of truth for car inventory records and lightweight shared schemas or helpers needed by both surfaces. Shared package types SHALL be defined from focused Zod schemas with inferred TypeScript types.

#### Scenario: Both app surfaces use the same car records
- **WHEN** the `web` package and the `mcp` package load rental inventory
- **THEN** they MUST resolve vehicle records from the shared package with the same vehicle IDs, names, licence-category requirements, and pricing metadata

#### Scenario: Shared schemas define shared types
- **WHEN** a shared vehicle or booking payload type is exported for cross-package use
- **THEN** the type MUST be inferred from a Zod schema defined in the shared package

#### Scenario: Shared package stays pragmatic
- **WHEN** booking-session state, Vidos integration, or host-specific widget behavior is implemented
- **THEN** that runtime behavior MUST remain outside the shared package

### Requirement: Agent-facing rental search

The MCP package SHALL expose a model-visible rental search capability that accepts destination and trip context and returns ranked car results for conversational use. Each result SHALL include enough structured data for clear chat narration, including vehicle ID, display name, category, required licence category, seats, transmission, price per day, total estimate, and short comparison-friendly attributes.

#### Scenario: Search for Tenerife rentals
- **WHEN** the user asks to rent a car in Tenerife
- **THEN** the search capability returns Tenerife-relevant vehicles ranked for that destination and trip context

#### Scenario: Search output is text-first for the agent
- **WHEN** rental search completes
- **THEN** the result includes structured car data for the model and plain text content summarizing the available options without requiring a car-listing widget

### Requirement: Car selection creates booking context

The system SHALL persist the selected vehicle in a server-side booking context before booking starts. The booking context SHALL include an explicit booking session identifier and the selected rental inputs needed for later verification and confirmation.

- **WHEN** the user chooses one of the cars presented by the agent
- **THEN** the server records that vehicle as the active selection for the booking session and returns an authoritative booking snapshot

#### Scenario: Agent can continue after selection
- **WHEN** a car is selected from the widget
- **THEN** the host receives enough state for the agent to acknowledge the choice and offer booking continuation in the next turn
