# Infrastructure: AWS Lightsail Deployment

This folder contains the Pulumi project that provisions AWS infrastructure for use case backends and hosted agent services.

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
- `lightsail:ticketAgentPublicDomainName` (optional, for example `api-ticket-agent.demo.vidos.id`)
- `lightsail:ticketAgentCertificateName` (optional, required when attaching the custom ticket-agent domain)
- `vidos:mcpWinePublicBaseUrl` (set this explicitly for the hosted wine MCP base URL, for example `https://mcp-wine-agent.demo.vidos.id/mcp`)
- `vidos:mcpCarRentalPublicBaseUrl` (set this explicitly for the hosted car-rental MCP base URL, for example `https://mcp-car-rent.demo.vidos.id/mcp`)
- `vidos:mcpWinePort` (optional, default 30123)
- `vidos:mcpCarRentalPort` (optional, default 30124)
- `vidos:mcpPath` (optional, default /mcp)

Update configuration:

```bash
pulumi config set vidos:authorizerUrl <url> --secret
pulumi config set vidos:apiKey <key> --secret
pulumi config set lightsail:ticketAgentPublicDomainName api-ticket-agent.demo.vidos.id
pulumi config set lightsail:ticketAgentCertificateName <certificate-name>
pulumi config set vidos:mcpWinePublicBaseUrl https://mcp-wine-agent.demo.vidos.id/mcp
pulumi config set vidos:mcpCarRentalPublicBaseUrl https://mcp-car-rent.demo.vidos.id/mcp
pulumi config set vidos:mcpWinePort 30123
pulumi config set vidos:mcpCarRentalPort 30124
pulumi config set vidos:mcpPath /mcp
```

## Deploy application updates

From the repo root:

```bash
bun scripts/deploy.ts
```

This script:

1. Authenticates to ECR
2. Builds `Dockerfile.server`, `Dockerfile.mcp-wine-agent`, `Dockerfile.mcp-car-rental-agent`, and `Dockerfile.ticket-agent`
3. Tags the image with git SHA or timestamp
4. Pushes the images to ECR
5. Updates the Lightsail services, including the ticket-agent container

View the endpoint:

```bash
cd infrastructure
pulumi stack output endpoint
pulumi stack output ticketAgentEndpoint
pulumi stack output ticketAgentPublicUrl
```

## Logs

Use AWS CLI to list deployments and fetch logs:

```bash
aws lightsail get-container-services --region eu-west-1
aws lightsail get-container-service-deployments --service-name <service-name> --region eu-west-1
aws lightsail get-container-log --service-name <service-name> --container-name backend --region eu-west-1
aws lightsail get-container-log --service-name <ticket-agent-service-name> --container-name ticket-agent --region eu-west-1
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
- If the hosted ticket-agent issuer metadata advertises the raw Lightsail URL instead of `api-ticket-agent.demo.vidos.id`, verify `lightsail:ticketAgentPublicDomainName` and `lightsail:ticketAgentCertificateName` are set and the deployment has been re-run.
