# Usecase Specific Authorizer Explanations

## Purpose

This spec defines requirements for how use case apps (car-rental, demo-bank) should present Vidos Authorizer API information in their guide/how-it-works pages.

## Requirements

### Requirement: Use Case Guides Focus on Authorizer API Flow Only
The system SHALL keep car-rental and demo-bank guide/how-it-works pages focused on each use case's specific communication with the Vidos Authorizer API.

#### Scenario: Car-rental page explains car-rental-specific flow
- **WHEN** a user opens the car-rental explanation page
- **THEN** the content describes car-rental-specific authorization request creation, QR/deeplink handoff, lifecycle/status progression, and result handling
- **THEN** the content excludes generic wallet setup instructions

#### Scenario: Demo-bank page explains demo-bank-specific flow
- **WHEN** a user opens the demo-bank guide page
- **THEN** the content describes demo-bank-specific authorization and callback flow behavior tied to banking journeys
- **THEN** the content excludes generic wallet setup instructions

### Requirement: Use Case Apps Link to Home Generic Guides Via Anchors
The system SHALL use standard HTML anchor links for navigation from use case apps to home generic guides because these applications are deployed as separate web apps.

#### Scenario: Cross-app links do not use router link components
- **WHEN** a CTA points from car-rental or demo-bank to `usecases-home`
- **THEN** navigation is implemented with `<a>` elements targeting absolute cross-app URLs
- **THEN** in-app router `Link` components are not used for those cross-app destinations

#### Scenario: Links work with root and subpath deployments
- **WHEN** `usecases-home` is hosted at root and car-rental/demo-bank are hosted on subpaths
- **THEN** cross-app CTA anchors navigate correctly using full URL env endpoints without relying on current app base path

#### Scenario: CTA preserves discoverability after content extraction
- **WHEN** generic sections are removed from a use case page
- **THEN** the page includes a visible CTA directing users to home generic guides

### Requirement: Content Hierarchy Prioritizes Executive Clarity
The system SHALL present use case explanation pages with a clear, structured hierarchy optimized for investor/executive readability, while still exposing developer-relevant detail.

#### Scenario: Executive-first narrative is visible at top level
- **WHEN** a user lands on a use case explanation page
- **THEN** the primary sections communicate business context and high-level verification story before deep implementation details

#### Scenario: Developer detail remains accessible
- **WHEN** a developer needs implementation-level understanding
- **THEN** the page provides explicit Authorizer API interaction details and state transitions in dedicated sections
