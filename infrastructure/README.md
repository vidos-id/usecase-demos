# Infrastructure: AWS Lightsail Deployment

This folder contains the Pulumi project that provisions AWS infrastructure for use case backends.

## Prerequisites

- AWS CLI (`aws --version`)
- Pulumi CLI (`pulumi version`)
- Docker (`docker --version`)
- Node.js (for running the TypeScript deploy script)

## Initial setup

```bash
cd infrastructure
npm install
pulumi login s3://vidos-demo-pulumi-state
pulumi stack init demo
pulumi config set aws:region eu-west-1
pulumi config set vidos:authorizerUrl <url> --secret
pulumi config set vidos:apiKey <key> --secret
pulumi up
```

## Configuration

Secrets are stored via Pulumi config:

- `vidos:authorizerUrl` (required)
- `vidos:apiKey` (optional)

Update configuration:

```bash
pulumi config set vidos:authorizerUrl <url> --secret
pulumi config set vidos:apiKey <key> --secret
```

## Deploy application updates

From the repo root:

```bash
bun scripts/deploy.ts
```

This script:

1. Authenticates to ECR
2. Builds `Dockerfile.server` (currently `usecases/demo-bank/server`)
3. Tags the image with git SHA or timestamp
4. Pushes the image to ECR
5. Updates the Lightsail service

View the endpoint:

```bash
cd infrastructure
pulumi stack output endpoint
```

## Logs

Use AWS CLI to list deployments and fetch logs:

```bash
aws lightsail get-container-services --region eu-west-1
aws lightsail get-container-service-deployments --service-name <service-name> --region eu-west-1
aws lightsail get-container-log --service-name <service-name> --container-name backend --region eu-west-1
```

## Teardown

```bash
cd infrastructure
pulumi destroy
```

## Cost estimate

- Lightsail Container Service (micro): about $7/month
- ECR storage: minimal for 5 images

## Troubleshooting

- Ensure AWS credentials are configured for `eu-west-1`.
- If `pulumi up` fails on permissions, verify IAM access to Lightsail and ECR.
- If the deployment script fails ECR login, confirm the repository URL and AWS region match stack outputs.
