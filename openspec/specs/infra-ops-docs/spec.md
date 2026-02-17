## Purpose

Define the documentation requirements for infrastructure setup and operations.

## Requirements

### Requirement: Document prerequisites and setup
The documentation SHALL list required tools and provide initial Pulumi setup steps for a dev stack in `eu-west-1`.

#### Scenario: New user setup
- **WHEN** a new user follows the README
- **THEN** they can complete initial Pulumi setup and configuration

### Requirement: Document configuration and secrets
The documentation SHALL describe how to set `vidos:authorizerUrl` and `vidos:apiKey` as Pulumi secrets.

#### Scenario: Secret configuration
- **WHEN** a user needs to configure environment variables
- **THEN** the README explains which keys to set and how

### Requirement: Document deployment and updates
The documentation SHALL describe how to run the TypeScript deployment script and how to retrieve the public endpoint URL.

#### Scenario: Deploying updates
- **WHEN** a user wants to deploy a new image
- **THEN** the README explains the deploy command and how to view the endpoint

### Requirement: Document logs and teardown
The documentation SHALL provide instructions for viewing logs and tearing down infrastructure via `pulumi destroy`.

#### Scenario: Troubleshooting and cleanup
- **WHEN** a user needs logs or to remove resources
- **THEN** the README provides the required commands
