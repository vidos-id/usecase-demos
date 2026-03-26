# Centralized Demo Guidance

## Purpose

This spec defines requirements for centralized demo guidance in `usecases-home`, including wallet setup, credential preparation, and shared demo "how it works" content.

## Requirements

### Requirement: Home App Is Canonical Source for Generic Guidance
The system SHALL host generic demo guidance in `usecases-home` as the canonical source for wallet setup, credential preparation, and shared demo "how it works" content.

#### Scenario: Generic guidance is removed from use case apps
- **WHEN** generic guidance exists in `usecases/car-rental` or `usecases/demo-bank`
- **THEN** that generic guidance is extracted from those use case apps
- **THEN** equivalent guidance is available in `usecases-home`

#### Scenario: Wallet setup and credential prep are centralized
- **WHEN** a user opens the home guidance surface
- **THEN** the page includes wallet setup guidance and credential issuance/preparation instructions applicable across demos

### Requirement: Extracted Guidance Uses Dedicated Home Routes
The system SHALL expose extracted generic guidance as separate pages in `usecases-home` routed by TanStack Router.

#### Scenario: Home guides are not only homepage blocks
- **WHEN** extracted generic guidance is published in `usecases-home`
- **THEN** wallet setup, credential preparation, and shared "how demos work" guidance are accessible via dedicated routes
- **THEN** navigation to these guides is available from the home app navigation structure

#### Scenario: Home routing scales as pages grow
- **WHEN** additional generic guide pages are added
- **THEN** route definitions are managed in the `usecases-home` TanStack Router tree using established app conventions

### Requirement: Migrated Generic Content Follows Home Design Language
The system SHALL render extracted generic guidance in `usecases-home` using home app visual patterns and component conventions.

#### Scenario: Home visual system is preserved after extraction
- **WHEN** generic guide content is migrated into `usecases-home`
- **THEN** typography, spacing, and layout patterns match established home app styling
- **THEN** source use case-specific styling is not reused if it conflicts with home app design language

#### Scenario: Guide page composition uses small components
- **WHEN** generic guidance pages are implemented or updated in `usecases-home`
- **THEN** page sections are split into focused components to keep files small and maintainable

### Requirement: Cross-App URL Targets Are Environment Configurable
The system SHALL configure cross-application navigation targets via `VITE_` environment variables that contain complete destination URLs.

#### Scenario: Local environment uses local app URLs
- **WHEN** the app runs in local development
- **THEN** cross-app links use environment-provided local full URLs without hardcoded production hosts

#### Scenario: Production environment uses deployed app URLs
- **WHEN** the app runs in production
- **THEN** cross-app links use environment-provided deployed full URLs without code changes

#### Scenario: Full URL env vars avoid runtime mapping logic
- **WHEN** rendering a cross-app link
- **THEN** the app uses the env var value directly as the anchor `href`
- **THEN** the app does not build hrefs via base URL and path resolution logic

### Requirement: Migrated Home Guides Preserve Source Detail
The system SHALL preserve practical detail depth from extracted guides when content is moved to `usecases-home`.

#### Scenario: Wallet-specific guide variants are retained
- **WHEN** demo-bank wallet guide content is migrated
- **THEN** guidance remains separated per wallet variant with wallet-specific instructions

#### Scenario: Wallet-specific download links are retained
- **WHEN** a wallet variant requires its own install path
- **THEN** the migrated guide includes the corresponding wallet-specific download links

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
