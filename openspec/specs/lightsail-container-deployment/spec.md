## Purpose

Define the infrastructure requirements for deploying the backend on AWS Lightsail.

## Requirements

### Requirement: Provision Lightsail service and ECR
The infrastructure code SHALL provision an AWS Lightsail Container Service and a private ECR repository in `eu-west-1` for the demo backend.

#### Scenario: Initial provisioning
- **WHEN** `pulumi up` is executed for the dev stack
- **THEN** the Lightsail service and ECR repository exist in `eu-west-1`

### Requirement: Configure Lightsail service runtime
The Lightsail service SHALL be configured as a micro tier service with a single node, exposing port 3000 via a public HTTPS endpoint.

#### Scenario: Service endpoint enabled
- **WHEN** the Lightsail service is created
- **THEN** a public HTTPS endpoint is enabled for port 3000

### Requirement: ECR lifecycle policy
The ECR repository SHALL enforce a lifecycle policy that retains only the five most recent images.

#### Scenario: Lifecycle policy applied
- **WHEN** the ECR repository is created
- **THEN** the lifecycle policy limits retained images to five

### Requirement: Minimal IAM permissions
The infrastructure SHALL configure a Lightsail service role with minimal permissions required to pull images from the ECR repository.

#### Scenario: Pull permissions configured
- **WHEN** the Lightsail service role is created
- **THEN** it can pull images from the ECR repository and has no broader permissions

### Requirement: Resource tagging
All provisioned AWS resources SHALL be tagged with `Project=usecase-demos`, `ManagedBy=Pulumi`, and `Environment=dev`.

#### Scenario: Tags applied
- **WHEN** resources are created by Pulumi
- **THEN** each resource includes the required tags
