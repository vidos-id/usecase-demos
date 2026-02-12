## ADDED Requirements

### Requirement: Layout includes navigation header
The base layout SHALL include a navigation header visible on all routes.

#### Scenario: Header is present on all pages
- **WHEN** user navigates to any route
- **THEN** navigation header is rendered at top of page

#### Scenario: Header contains branding
- **WHEN** header is rendered
- **THEN** DemoBank branding/logo is visible

### Requirement: Layout includes progress indicator slot
The base layout SHALL include a slot for the progress indicator component.

#### Scenario: Progress indicator slot is positioned correctly
- **WHEN** layout renders
- **THEN** progress indicator slot is positioned below header and above main content

#### Scenario: Progress indicator slot is conditional
- **WHEN** current route should not show progress indicator
- **THEN** progress indicator slot renders nothing (no empty space)

### Requirement: Layout includes main content area
The base layout SHALL include a main content area where route-specific content is rendered.

#### Scenario: Main content area renders route content
- **WHEN** user navigates to any route
- **THEN** route-specific content is rendered in main content area

#### Scenario: Main content area is scrollable
- **WHEN** route content exceeds viewport height
- **THEN** main content area is scrollable while header remains fixed

### Requirement: Layout is mobile-first responsive
The base layout SHALL use mobile-first responsive design with breakpoints from 320px to 2560px.

#### Scenario: Layout renders on mobile (320px)
- **WHEN** viewport width is 320px
- **THEN** header, progress indicator, and content stack vertically without horizontal scroll

#### Scenario: Layout renders on tablet (768px)
- **WHEN** viewport width is 768px
- **THEN** layout uses tablet-optimized spacing and typography

#### Scenario: Layout renders on desktop (1920px)
- **WHEN** viewport width is 1920px
- **THEN** layout uses desktop-optimized spacing with appropriate max-width constraints

#### Scenario: Layout renders on large desktop (2560px)
- **WHEN** viewport width is 2560px
- **THEN** layout content does not stretch excessively (uses max-width)

### Requirement: Layout uses Tailwind breakpoints
The base layout SHALL use Tailwind CSS default breakpoints for responsive styling.

#### Scenario: Base styles target mobile
- **WHEN** no breakpoint prefix is used
- **THEN** styles apply to viewports < 640px

#### Scenario: sm breakpoint targets large mobile
- **WHEN** `sm:` prefix is used
- **THEN** styles apply to viewports ≥ 640px

#### Scenario: md breakpoint targets tablet
- **WHEN** `md:` prefix is used
- **THEN** styles apply to viewports ≥ 768px

#### Scenario: lg breakpoint targets desktop
- **WHEN** `lg:` prefix is used
- **THEN** styles apply to viewports ≥ 1024px

### Requirement: Layout includes account menu for authenticated users
The base layout SHALL display an account menu in the header when user is authenticated.

#### Scenario: Account menu visible when authenticated
- **WHEN** user is authenticated
- **THEN** account menu is visible in header

#### Scenario: Account menu hidden when unauthenticated
- **WHEN** user is not authenticated
- **THEN** account menu is not rendered

#### Scenario: Account menu includes sign out option
- **WHEN** authenticated user opens account menu
- **THEN** "Sign Out" option is available

#### Scenario: Account menu includes reset demo data option
- **WHEN** authenticated user opens account menu
- **THEN** "Reset Demo Data" option is visible (may be disabled/stubbed)

### Requirement: Layout provides consistent spacing
The base layout SHALL use consistent padding and margins across all routes.

#### Scenario: Content padding is consistent
- **WHEN** user navigates between routes
- **THEN** main content area uses same horizontal padding on all routes

#### Scenario: Vertical spacing follows hierarchy
- **WHEN** layout renders
- **THEN** spacing between header, progress indicator, and content is consistent across routes

### Requirement: Layout supports nested route layouts
The base layout SHALL support nested layouts for authenticated vs unauthenticated routes.

#### Scenario: Authenticated routes use protected layout wrapper
- **WHEN** user accesses protected route
- **THEN** protected layout wrapper (`_auth.tsx`) is rendered around route content

#### Scenario: Public routes use base layout only
- **WHEN** user accesses public route
- **THEN** only base layout (`__root.tsx`) is rendered around route content

### Requirement: Layout uses React Context for shared state
The base layout SHALL use React Context to provide shared state (e.g., current journey step) to child components.

#### Scenario: Progress context is available to children
- **WHEN** component is rendered within layout
- **THEN** component can access progress context via React.useContext

#### Scenario: Context updates trigger re-renders
- **WHEN** route changes and progress context updates
- **THEN** components consuming context re-render with new values
