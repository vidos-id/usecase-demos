## Purpose

OpenClaw skill file describing the HTTP API endpoints, wallet-cli integration for credential import and OpenID4VP presentation, and the complete agent-side delegation and purchasing flow.

## Requirements

### Requirement: Skill file describes complete agent flow

The skill file (`skill.md`) SHALL describe the end-to-end agent flow in a sequence the agent can follow: (1) initialize wallet and provide public key to user, (2) receive and import delegation credential from user, (3) browse events via API, (4) create bookings via API, (5) present delegation credential when challenged, (6) poll booking status until terminal. The file SHALL be self-contained and not require the agent to reference external documentation.

#### Scenario: Agent follows skill to complete a booking
- **WHEN** an OpenClaw agent reads the skill file and follows its instructions
- **THEN** the agent SHALL be able to complete the full flow from wallet initialization through booking confirmation

### Requirement: Skill file documents all API endpoints

The skill file SHALL document every HTTP API endpoint the agent needs: `GET /api/events`, `GET /api/events/:id`, `POST /api/bookings`, and `GET /api/bookings/:id`. Each endpoint SHALL include the HTTP method, path, example request body (where applicable), and description of the response format. The base URL SHALL be configurable (the skill SHALL state a default and instruct the agent to use a user-provided URL if given).

#### Scenario: API endpoint documentation is complete
- **WHEN** the agent reads the skill file
- **THEN** it SHALL find documentation for every endpoint needed to browse events and create bookings

### Requirement: Skill file documents wallet-cli usage

The skill file SHALL document the `wallet-cli` commands the agent needs: `wallet-cli init` (to generate holder key and provide the public key to the user), `wallet-cli import` (to import the delegation credential the user pastes), and `wallet-cli present --request <authorizeUrl>` (to present the delegation credential when a booking returns an `authorizeUrl`). Each command SHALL include the exact syntax, required flags, and expected output.

#### Scenario: Wallet initialization documented
- **WHEN** the agent needs to generate its holder key
- **THEN** the skill file SHALL document the exact `wallet-cli init` command and explain how to extract the public key to provide to the user

#### Scenario: Credential import documented
- **WHEN** the user pastes a delegation credential
- **THEN** the skill file SHALL document the exact `wallet-cli import` command to store it

#### Scenario: Credential presentation documented
- **WHEN** a booking returns an `authorizeUrl`
- **THEN** the skill file SHALL document the exact `wallet-cli present --request <url>` command to respond to the verification challenge

### Requirement: Skill file defines fixed flow

The skill file SHALL define a fixed flow sequence that the agent follows, similar to the car-rental skill. The agent SHALL NOT ask the user for identity details in chat — identity verification happens through wallet credential presentation. The agent SHALL NOT skip the wallet verification step or fabricate booking confirmations.

#### Scenario: Agent does not collect identity in chat
- **WHEN** the agent interacts with the user
- **THEN** it SHALL NOT ask for name, date of birth, or other identity details — these come from the credential

#### Scenario: Agent follows fixed API call sequence
- **WHEN** the agent processes a booking
- **THEN** it SHALL follow the sequence: browse events → create booking → present credential → poll status → report result

### Requirement: Skill file documents autonomous credential presentation

The skill file SHALL instruct the agent that when a booking returns an `authorizeUrl`, the agent SHALL use `wallet-cli present --request <authorizeUrl>` to autonomously complete the verification. The agent does NOT generate a QR code or display anything to the user — the `wallet-cli` handles the full VP creation, KB-JWT signing, and `direct_post` submission to Vidos. After presenting, the agent SHALL poll `GET /api/bookings/:id` every 3 seconds for up to 180 seconds until a terminal status is reached.

#### Scenario: Agent presents credential autonomously
- **WHEN** a booking returns an `authorizeUrl`
- **THEN** the skill file SHALL instruct the agent to call `wallet-cli present` directly, not to generate a QR code

#### Scenario: Polling behavior documented
- **WHEN** the agent is waiting for verification after presenting
- **THEN** the skill file SHALL document the polling interval (3 seconds), timeout (180 seconds), and terminal statuses

### Requirement: Skill file describes delegation setup phase

The skill file SHALL describe the delegation setup phase where the agent initializes its wallet, provides its public key to the user, and waits for the user to paste back the issued delegation credential. The skill SHALL explain that the user completes the delegation setup in a separate web application and the agent's role is to provide its key and import the resulting credential.

#### Scenario: Agent explains setup to user
- **WHEN** the skill is first used in a session
- **THEN** the agent SHALL proactively explain the delegation setup process and provide its public key
