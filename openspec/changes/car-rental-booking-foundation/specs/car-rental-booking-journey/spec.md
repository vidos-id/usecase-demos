## ADDED Requirements

### Requirement: Booking journey stages
The system SHALL provide a rental booking journey with distinct stages for search, vehicle selection, and booking review before verification.

#### Scenario: User completes pre-verification journey
- **WHEN** a user enters location and dates, selects a vehicle, and opens booking review
- **THEN** the system shows a complete booking summary with selected rental details

### Requirement: Booking context creation
The system SHALL create a booking context with a unique `bookingId` before entering verification.

#### Scenario: Enter verification with valid booking
- **WHEN** a user clicks continue from booking review with valid required fields
- **THEN** the system creates a booking context containing `bookingId`, rental details, and booking status

### Requirement: Booking transition guards
The system SHALL block progression to verification if required booking data is incomplete or invalid.

#### Scenario: Block invalid booking progression
- **WHEN** a user attempts to continue with missing location, dates, or selected vehicle
- **THEN** the system prevents progression and indicates missing required information

### Requirement: Booking restore behavior
The system SHALL persist in-progress booking context locally and restore it after page refresh.

#### Scenario: Restore booking after refresh
- **WHEN** a user refreshes while booking is in draft or review state
- **THEN** the system restores the previous booking context and stage without data loss
