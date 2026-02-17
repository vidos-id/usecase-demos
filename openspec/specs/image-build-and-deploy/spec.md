## Purpose

Define the requirements for building, tagging, and deploying backend container images.

## Requirements

### Requirement: Build and tag image
The deployment script SHALL build the backend image from `Dockerfile.server` and tag it with a version derived from the git SHA when available, otherwise a timestamp.

#### Scenario: Git SHA available
- **WHEN** the repository has a git SHA available
- **THEN** the built image tag includes the git SHA

#### Scenario: Git SHA unavailable
- **WHEN** no git SHA is available
- **THEN** the built image tag uses a timestamp fallback

### Requirement: Authenticate to ECR
The deployment script SHALL authenticate to ECR using `aws ecr get-login-password` before pushing images.

#### Scenario: ECR login
- **WHEN** the script runs the ECR login step
- **THEN** Docker is authenticated to the ECR registry

### Requirement: Push and deploy image
The deployment script SHALL push the tagged image to ECR and update the Lightsail service to use the new image.

#### Scenario: Successful rollout
- **WHEN** the script completes a push
- **THEN** the Lightsail service is updated to the new image tag

### Requirement: Pre-flight checks and errors
The deployment script SHALL verify required tools (Docker, AWS CLI, jq, Node) and exit with a non-zero status on failures.

#### Scenario: Missing dependency
- **WHEN** a required tool is missing
- **THEN** the script exits with a clear error message and non-zero status
