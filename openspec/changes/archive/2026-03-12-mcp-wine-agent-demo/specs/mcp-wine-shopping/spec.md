## Purpose

Agent-facing wine catalog, recommendation inputs, cart management, and checkout initiation.

## ADDED Requirements

### Requirement: Wine catalog tool for agent selection

The system SHALL expose an MCP tool that returns a structured catalog of available wines for the agent to evaluate against user criteria such as occasion, style, quality tier, region, and price range. The tool SHALL also return plain-language text suitable for the agent to summarize in chat.

#### Scenario: Agent requests wines for an occasion
- **WHEN** the user asks the agent to find a wine for a gift or occasion
- **THEN** the system returns structured wine options and text content that the agent can use to recommend suitable bottles in chat

#### Scenario: Catalog response stays text-first
- **WHEN** the catalog tool is invoked
- **THEN** the system does not require a product browsing UI and provides enough text and structured data for the agent to continue the flow in chat

### Requirement: Cart management tools

The system SHALL expose MCP tools to add wines to a cart, remove items from a cart, and retrieve the current cart summary. The first successful add-to-cart call SHALL create and return an explicit `cartSessionId`, and subsequent cart and checkout calls SHALL require that same `cartSessionId`. The cart summary SHALL include line items, quantities, subtotal, whether age-restricted products are present, and whether verification is required before purchase.

#### Scenario: Add wine to cart
- **WHEN** the agent calls the add-to-cart tool with a valid wine identifier
- **THEN** the system stores the item in the cart and returns an updated authoritative cart snapshot plus the explicit `cartSessionId` to reuse in later calls

#### Scenario: Cart identity remains explicit
- **WHEN** the agent later calls `get_cart`, `remove_from_cart`, or `initiate_checkout`
- **THEN** the system requires the exact `cartSessionId` returned earlier instead of inferring cart state from transport/session behavior

#### Scenario: Cart indicates verification requirement
- **WHEN** the cart contains one or more age-restricted wine products
- **THEN** the cart summary marks checkout as requiring age verification

### Requirement: Checkout initiation

The system SHALL expose an MCP tool to begin checkout from the current cart. If the cart contains age-restricted wine, the checkout result SHALL immediately create the verification authorization and enter a verification-required state before purchase can complete.

#### Scenario: Checkout starts with wine in cart
- **WHEN** the agent starts checkout for a cart that contains wine
- **THEN** the system creates a checkout session in a verification-required state, starts authorization immediately, and returns the next action for the agent

#### Scenario: Empty cart cannot checkout
- **WHEN** the agent attempts to start checkout with an empty cart
- **THEN** the system rejects the request with a clear error describing that the cart is empty

### Requirement: Agent-readable checkout summary

The system SHALL return checkout summaries that can be directly narrated by the agent in chat. The summary SHALL include cart contents, verification requirement, current verification state, and the next action the user should take.

#### Scenario: Agent explains next step before verification
- **WHEN** checkout requires age verification
- **THEN** the system returns a summary telling the agent to instruct the user to scan the QR code and continue once verification is complete
