## ADDED Requirements

### Requirement: Display credential disclosure before wallet interaction

The system SHALL display a credential disclosure to users before they initiate credential sharing via QR code, deep link, or DC API. The disclosure MUST show:

1. The purpose/reason for requesting credentials
2. The list of credentials that will be requested from the wallet
3. Human-readable labels for each credential (not technical claim names)

#### Scenario: Display disclosure in signup flow

- **WHEN** user initiates signup with credential verification
- **THEN** the system displays a credential disclosure showing:
  - The purpose ("Verify your identity for signup")
  - The list of credentials (Family Name, Given Name, Date of Birth, Email, Place of Birth, Nationalities, Personal ID Number, Document Number, Profile Picture)

#### Scenario: Display disclosure in signin flow

- **WHEN** user initiates signin with credential verification
- **THEN** the system displays a credential disclosure showing:
  - The purpose ("Verify your identity for signin")
  - The list of credentials (Personal ID Number)

#### Scenario: Display disclosure in payment flow

- **WHEN** user initiates payment with credential verification
- **THEN** the system displays a credential disclosure showing:
  - The purpose ("Confirm your identity for payment")
  - The list of credentials (Personal ID Number, Family Name, Given Name)

#### Scenario: Display disclosure in loan flow

- **WHEN** user initiates loan application with credential verification
- **THEN** the system displays a credential disclosure showing:
  - The purpose ("Verify your identity for loan application")
  - The list of credentials (Personal ID Number, Family Name, Given Name)

### Requirement: Credential labels are human-readable

The system SHALL map technical PID claim names to human-readable labels. Technical claim names from the PID SD-JWT schema MUST be displayed using the following human-readable labels:

| Technical Claim | Human-Readable Label |
|-----------------|----------------------|
| `family_name` | Family Name |
| `given_name` | Given Name |
| `birthdate` | Date of Birth |
| `email` | Email Address |
| `nationalities` | Nationalities |
| `place_of_birth` | Place of Birth |
| `personal_administrative_number` | Personal ID Number |
| `document_number` | Document Number |
| `picture` | Profile Picture |

#### Scenario: Display human-readable label for known claim

- **WHEN** the system displays a credential with claim name `family_name`
- **THEN** the display shows "Family Name" (not "family_name")

#### Scenario: Display technical name for unknown claim

- **WHEN** the system displays a credential with an unknown claim name
- **THEN** the display shows the technical claim name as-is (fallback behavior)

### Requirement: Disclosure appears before QR/deep-link prompt

The credential disclosure MUST appear BEFORE the QR code, deep link, or DC API handler in the user flow. The user MUST see what credentials will be requested before initiating the wallet interaction.

#### Scenario: Disclosure shown before QR code (direct_post mode)

- **WHEN** user is in signup/signin/payment/loan flow with `direct_post` mode
- **THEN** the credential disclosure is displayed above the QR code

#### Scenario: Disclosure shown before DC API handler

- **WHEN** user is in signup/signin/payment/loan flow with `dc_api` mode
- **THEN** the credential disclosure is displayed above the DC API interaction UI

### Requirement: API response includes requested claims

The credential request API responses (signup/signin/payment/loan `/request` endpoints) SHALL include `requestedClaims` and `purpose` fields to enable the client to display the disclosure.

#### Scenario: API returns requested claims

- **WHEN** client calls the `/signup/request` (or `/signin`, `/payment`, `/loan`) endpoint
- **THEN** the response includes:
  - `requestedClaims`: array of claim names being requested
  - `purpose`: human-readable purpose string for the request

#### Scenario: Client uses API response to render disclosure

- **WHEN** client receives API response with `requestedClaims` and `purpose`
- **THEN** client renders the disclosure using these values
