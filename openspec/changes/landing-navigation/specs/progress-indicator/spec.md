## ADDED Requirements

### Requirement: Progress indicator displays journey steps
The progress indicator SHALL display four journey steps: Intro, Authenticate, Action, and Finish.

#### Scenario: Progress indicator shows all steps
- **WHEN** progress indicator is rendered
- **THEN** system displays steps in order: Intro → Authenticate → Action → Finish

#### Scenario: Step labels are clear
- **WHEN** user views progress indicator
- **THEN** each step displays a readable label

### Requirement: Progress indicator highlights current step
The progress indicator SHALL visually highlight the user's current step in the journey.

#### Scenario: Current step is visually distinct
- **WHEN** user is on a route mapped to a specific step
- **THEN** that step is highlighted with distinct styling (e.g., color, weight, or border)

#### Scenario: Only one step is highlighted at a time
- **WHEN** progress indicator renders
- **THEN** exactly one step is highlighted as current

### Requirement: Progress indicator marks completed steps
The progress indicator SHALL visually mark steps that the user has completed.

#### Scenario: Completed steps are distinguishable
- **WHEN** user progresses past a step
- **THEN** previous steps are marked as completed with distinct visual styling

#### Scenario: Completed steps indicate progress direction
- **WHEN** user views completed steps
- **THEN** visual indicators (e.g., checkmarks, filled circles) show forward progression

### Requirement: Progress indicator adapts to flow type
The progress indicator SHALL adapt its display based on the current flow type (signup vs signin, payment vs loan).

#### Scenario: Progress indicator reflects signup flow
- **WHEN** user is in signup flow
- **THEN** progress indicator shows steps relevant to account creation

#### Scenario: Progress indicator reflects payment flow
- **WHEN** user is in payment flow (`/send/*`)
- **THEN** progress indicator shows steps relevant to sending payment

#### Scenario: Progress indicator reflects loan flow
- **WHEN** user is in loan flow (`/loan/*`)
- **THEN** progress indicator shows steps relevant to loan application

### Requirement: Progress indicator is hidden on non-flow routes
The progress indicator SHALL NOT display on routes that are not part of a linear flow (e.g., dashboard, profile).

#### Scenario: Progress indicator hidden on dashboard
- **WHEN** user navigates to `/dashboard`
- **THEN** progress indicator is not rendered

#### Scenario: Progress indicator hidden on profile
- **WHEN** user navigates to `/profile`
- **THEN** progress indicator is not rendered

#### Scenario: Progress indicator visible on flow routes
- **WHEN** user navigates to `/signup`, `/send`, or `/loan`
- **THEN** progress indicator is rendered

### Requirement: Progress indicator is mobile-responsive
The progress indicator SHALL be fully responsive and usable on viewports from 320px to 2560px.

#### Scenario: Progress indicator renders on mobile
- **WHEN** user views progress indicator on 320px viewport
- **THEN** all steps are visible and labels are readable (may use abbreviated labels or icons)

#### Scenario: Progress indicator renders on desktop
- **WHEN** user views progress indicator on 1920px viewport
- **THEN** steps are displayed with full labels and appropriate spacing

### Requirement: Progress indicator derives state from route
The progress indicator SHALL determine current step and completed steps based on the current route path.

#### Scenario: Landing page maps to Intro step
- **WHEN** user is on `/`
- **THEN** progress indicator shows Intro as current step

#### Scenario: Signup/signin map to Authenticate step
- **WHEN** user is on `/signup` or `/signin`
- **THEN** progress indicator shows Authenticate as current step

#### Scenario: Send/loan routes map to Action step
- **WHEN** user is on `/send`, `/send/confirm`, or `/loan`
- **THEN** progress indicator shows Action as current step

#### Scenario: Success routes map to Finish step
- **WHEN** user is on `/send/success` or `/loan/success`
- **THEN** progress indicator shows Finish as current step
