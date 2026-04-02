# ticket-agent

This use case contains three colocated workspaces:

- `usecases/ticket-agent/web/` - browser demo hosted at `/ticket-agent/`
- `usecases/ticket-agent/shared/` - shared schemas, delegation credential types, and API contracts
- `usecases/ticket-agent/server/` - Hono API backend, issuer endpoints, and booking flow runtime

## Current deployment status

The deployment is now wired in the same way as the other hosted demos:

- GitHub Pages publishes the web app to `https://eudi-usecase.demo.vidos.id/ticket-agent/`
- AWS Lightsail runs the API container on port `53914`
- Pulumi provisions a dedicated `ticket-agent` Lightsail service
- GitHub Actions builds `Dockerfile.ticket-agent`, pushes the image to ECR, and deploys it through Pulumi
- The ticket-agent web build receives `VITE_TICKET_AGENT_SERVER_URL` from the infrastructure job output
- The ticket-agent server now publishes `ISSUER_PUBLIC_URL` from the custom public domain when configured, instead of the raw Lightsail service URL

Expected hosted endpoints:

- Web app: `https://eudi-usecase.demo.vidos.id/ticket-agent/`
- API and issuer base URL: `https://api-ticket-agent.demo.vidos.id`

## Useful commands

```bash
bun run dev:ticket-agent
bun run --filter ticket-agent-web check-types
bun run --filter ticket-agent-server check-types
bun run --filter ticket-agent-web build
```

## Local setup

1. Install dependencies from the repo root:

```bash
bun install
```

2. Create the server env file from the example and fill in the authorizer settings:

```bash
cp usecases/ticket-agent/server/.env.example usecases/ticket-agent/server/.env
```

3. Create the web env file only if you want the client to point at a non-local server:

```bash
cp usecases/ticket-agent/web/.env.example usecases/ticket-agent/web/.env
```

4. Start both packages together:

```bash
bun run dev:ticket-agent
```

Local defaults:

- Web app: `http://localhost:5173/ticket-agent/` if Vite picks the default port
- Server: `http://localhost:53914`
- Health check: `http://localhost:53914/api/health`

## Environment

### `web/`

- `usecases/ticket-agent/web/.env.local` is checked in with the local API server URL.
- Use `usecases/ticket-agent/web/.env.example` as the template when you want the web app to target a deployed server.
- `VITE_TICKET_AGENT_SERVER_URL` must point at the ticket-agent API base URL.

### `server/`

- `usecases/ticket-agent/server/.env.local` is checked in with local `DATABASE_PATH`, `PORT`, and `ISSUER_PUBLIC_URL`.
- Create `usecases/ticket-agent/server/.env` from `usecases/ticket-agent/server/.env.example` and set `VIDOS_AUTHORIZER_URL`.
- Set `VIDOS_API_KEY` only if your authorizer requires bearer auth.
- `ISSUER_PUBLIC_URL` is the public base URL used by the issuer metadata and all OID4VCI endpoints, including credential offer URLs.
- For local testing through ngrok, point `ISSUER_PUBLIC_URL` at your ngrok URL so remote wallets can resolve both the issuer and the offer.

## Hosted deployment setup

The ticket-agent deployment needs both static-site and container configuration.

### GitHub Pages

- The web app is built in `.github/workflows/deploy.yml`
- It is copied into `site/ticket-agent/`
- `web/vite.config.ts` already sets `base: "/ticket-agent/"`

### Lightsail and Pulumi

The infrastructure stack already provisions a dedicated Lightsail container service for ticket-agent. To finish the hosted setup, configure these GitHub repository variables for the deploy workflow:

- `TICKET_AGENT_PUBLIC_DOMAIN_NAME=api-ticket-agent.demo.vidos.id`
- `TICKET_AGENT_CERTIFICATE_NAME=<aws-lightsail-certificate-name>`

Required GitHub secrets:

- `VIDOS_AUTHORIZER_URL`
- `VIDOS_API_KEY` when bearer auth is required
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `PULUMI_ACCESS_TOKEN`
- `PULUMI_CONFIG_PASSPHRASE`

The workflow now pushes these Pulumi config values during deployment:

- `lightsail:ticketAgentImageTag`
- `lightsail:ticketAgentPublicDomainName`
- `lightsail:ticketAgentCertificateName`

Relevant stack outputs:

- `ticketAgentEndpoint` - raw Lightsail service URL
- `ticketAgentPublicUrl` - preferred public URL, using the custom domain when configured

## Manual infrastructure deployment

From `infrastructure/`:

```bash
pulumi config set vidos:authorizerUrl <url> --secret
pulumi config set vidos:apiKey <key> --secret
pulumi config set lightsail:ticketAgentPublicDomainName api-ticket-agent.demo.vidos.id
pulumi config set lightsail:ticketAgentCertificateName <certificate-name>
pulumi up
```

From the repo root, deploy all container images including ticket-agent:

```bash
bun scripts/deploy.ts
```

## Verification

After deployment, verify:

1. `https://api-ticket-agent.demo.vidos.id/api/health` returns `200`
2. `https://eudi-usecase.demo.vidos.id/ticket-agent/` loads correctly
3. The web app is configured against the public ticket-agent API URL
4. Credential offer URLs and issuer metadata resolve under `https://api-ticket-agent.demo.vidos.id`
