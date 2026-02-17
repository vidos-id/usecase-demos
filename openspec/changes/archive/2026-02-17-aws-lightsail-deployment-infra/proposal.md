## Why

We need a repeatable, low-cost way to deploy the demo backend without manual console setup so teammates can stand up the environment quickly. Lightsail Container Service in eu-west-1 provides a simple, budget-friendly path to a public HTTPS endpoint for demos now.

## What Changes

- Add Pulumi infrastructure code to provision a Lightsail Container Service with a public HTTPS endpoint in eu-west-1.
- Add a private ECR repository with a lifecycle policy to keep only the last 5 images.
- Add minimal IAM permissions for Lightsail to pull images from ECR.
- Add a TypeScript deployment script to build, tag, push, and roll out Docker images for the backend.
- Add documentation for setup, configuration, deployment, logs, teardown, and costs.

## Capabilities

### New Capabilities
- `lightsail-container-deployment`: Provision Lightsail Container Service and ECR via Pulumi for the demo backend.
- `image-build-and-deploy`: Build, tag, push, and deploy backend images to Lightsail using a TypeScript script.
- `infra-ops-docs`: Document infrastructure setup, configuration, deployment, logs, teardown, and costs.

### Modified Capabilities

<!-- None -->

## Impact

- New `infrastructure/` Pulumi project and `scripts/deploy.ts` in the repo.
- AWS resources: ECR repository, Lightsail Container Service, and IAM role/policy.
- Deployment workflow depends on AWS CLI, Pulumi CLI, Docker, and jq.
