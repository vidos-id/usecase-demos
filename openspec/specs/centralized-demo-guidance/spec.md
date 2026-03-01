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
