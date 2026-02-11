# Mode Selection Specifications

## ADDED Requirements

### Requirement: Display presentation mode options
The system SHALL provide UI for selecting between direct_post and dc_api presentation modes.

#### Scenario: Display both modes when DC API is supported
- **WHEN** page loads and browser supports Digital Credentials API
- **THEN** system displays radio options for "QR Code / Deep Link" (direct_post) and "Browser Wallet" (dc_api)
- **THEN** direct_post option is selected by default

#### Scenario: Display only direct_post when DC API is not supported
- **WHEN** page loads and browser does not support Digital Credentials API
- **THEN** system displays only "QR Code / Deep Link" option
- **THEN** dc_api option is hidden
- **THEN** direct_post option is selected by default

#### Scenario: User selects dc_api mode
- **WHEN** user clicks "Browser Wallet" radio option
- **THEN** system updates selected mode to dc_api
- **THEN** system stores mode in sessionStorage

#### Scenario: User selects direct_post mode
- **WHEN** user clicks "QR Code / Deep Link" radio option
- **THEN** system updates selected mode to direct_post
- **THEN** system stores mode in sessionStorage

### Requirement: Detect Digital Credentials API support
The system SHALL detect browser support for Digital Credentials API at component mount.

#### Scenario: Browser supports DC API
- **WHEN** component mounts and `navigator.credentials` exists and `DigitalCredential` exists in window
- **THEN** system sets dcApiSupported flag to true
- **THEN** dc_api mode option is visible

#### Scenario: Browser does not support DC API
- **WHEN** component mounts and `navigator.credentials` does not exist or `DigitalCredential` does not exist
- **THEN** system sets dcApiSupported flag to false
- **THEN** dc_api mode option is hidden

### Requirement: Persist mode preference in session
The system SHALL persist selected mode in browser sessionStorage.

#### Scenario: Mode stored on selection
- **WHEN** user selects a mode
- **THEN** system writes mode to sessionStorage with key "authMode"

#### Scenario: Mode restored on page load
- **WHEN** page loads and sessionStorage contains "authMode" key
- **THEN** system reads stored mode
- **THEN** system pre-selects corresponding radio option

#### Scenario: Default mode when no stored preference
- **WHEN** page loads and sessionStorage does not contain "authMode" key
- **THEN** system defaults to direct_post mode
