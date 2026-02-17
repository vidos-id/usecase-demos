## 1. Pulumi project setup

- [x] 1.1 Create `infrastructure/` directory with `Pulumi.yaml`, `package.json`, `tsconfig.json`, `.gitignore`, and `Pulumi.dev.yaml`
- [x] 1.2 Add dependencies for Pulumi AWS Classic provider and TypeScript tooling
- [x] 1.3 Implement `infrastructure/index.ts` with shared tags and region config

## 2. ECR repository and IAM

- [x] 2.1 Define private ECR repository with lifecycle policy for last 5 images
- [x] 2.2 Export ECR repository name and URL outputs
- [x] 2.3 Create Lightsail service role with minimal ECR pull permissions

## 3. Lightsail container service

- [x] 3.1 Create Lightsail Container Service (micro tier, 1 node) in eu-west-1
- [x] 3.2 Configure public HTTPS endpoint on port 3000 and container settings
- [x] 3.3 Wire environment variables for `VIDOS_AUTHORIZER_URL` and `VIDOS_API_KEY`
- [x] 3.4 Export Lightsail service name and endpoint outputs

## 4. TypeScript deploy script

- [x] 4.1 Add `scripts/deploy.ts` with CLI usage, pre-flight checks, and error handling
- [x] 4.2 Implement ECR auth, image build from `Dockerfile.server`, and tagging (git SHA or timestamp)
- [x] 4.3 Push image to ECR and update Lightsail service to new image tag
- [x] 4.4 Output deployment status and endpoint after rollout

## 5. Documentation

- [x] 5.1 Write `infrastructure/README.md` with prerequisites, setup, and configuration steps
- [x] 5.2 Document deployment workflow, logs access, and teardown commands
- [x] 5.3 Add cost estimate and troubleshooting notes
