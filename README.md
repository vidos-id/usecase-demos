# Vidos Use Case Demos

Open source demos showcasing **EU Digital Identity (EUDI) Wallet** integration with [Vidos](https://vidos.id/) verification infrastructure.

## Demos

### VidosDemoBank

A banking application demonstrating PID-based identity verification, KYC, and payment authentication.

**[Live Demo](https://vidos-id.github.io/usecase-demos/)** · [Source](./client/) · [Server](./server/)

## What This Demo Shows

- **PID-based Identification**: Verify users via Person Identification Data (PID) credentials from EUDI Wallets
- **Multi-Format Support**: Accept credentials in both SD-JWT VC and ISO mDoc formats
- **Passwordless Authentication**: Sign in/up using wallet credentials instead of email/password
- **Selective Disclosure**: Request only the attributes needed (name, birth date, nationality)
- **eIDAS 2.0 Compliance**: Demonstrates the authentication flow banks must support by Dec 2027

### Supported Protocols

- **OID4VP** (OpenID for Verifiable Presentations) via QR code
- **DC API** (Digital Credentials API) for browser-native flow

### Supported Credential Formats

- **SD-JWT VC** (`dc+sd-jwt`) - IETF SD-JWT Verifiable Credentials
- **mDoc** (`mso_mdoc`) - ISO/IEC 18013-5 mobile document format

### Compatible Wallets

- [EUDI Reference Wallet](https://github.com/eu-digital-identity-wallet) (Android APK)
- [Multipaz Wallet](https://github.com/nickkipshidze/multipaz-wallet) (OpenWallet Foundation)

## Project Structure

Bun + Turbo monorepo with three workspaces:

```
client/          # React + Vite frontend (TanStack Router, Tailwind)
server/          # Hono API server with Vidos SDK integration
shared/          # Zod schemas and TypeScript types
```

### Key Integration Points

| File                           | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `server/src/services/vidos.ts` | Vidos SDK setup and credential verification |
| `server/src/routes/verify.ts`  | OID4VP verification flow handlers           |
| `client/src/lib/api-client.ts` | Type-safe API client with Hono RPC          |
| `client/src/routes/_auth/`     | Protected routes requiring wallet auth      |

## Resources

- [Vidos Platform](https://vidos.id/) - Verification infrastructure powering this demo
- [Vidos Authorizer Tester](https://authorizer.demo.vidos.id/) - Test the authorizer directly
- [PID Rulebook](https://eudi.dev/latest/annexes/annex-3/annex-3.01-pid-rulebook/) - Official PID attribute schema
- [EUDI Architecture Reference](https://eudi.dev/latest/) - Full ARF documentation
- [PID Identification Manual](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/930451131/PID+Identification+Manual) - EU use case manual
- [Payment Authentication Manual](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/935397429/Payment+Authentication) - SCA with EUDI Wallets

## Commands

| Command               | Description               |
| --------------------- | ------------------------- |
| `bun run dev`         | Run all workspaces        |
| `bun run build`       | Build client (Vite)       |
| `bun run check-types` | Type-check all workspaces |
| `bun run lint`        | Lint with Biome           |
| `bun run format`      | Format with Biome         |

## Authorization Waiting Model (SSE)

Short change summary from `replace-polling-with-sse` proposal:

- Authorization/callback waiting is **push-based SSE**, not client polling.
- Server emits compact typed transition events: `connected`, `pending`, terminal events, and `error`.
- Client subscribes with browser `EventSource` and updates UI from stream events.
- Polling `/status/:requestId` endpoints were removed from auth flows.

## Deployment

### Server (Docker)

Docker-based deployment. Bun runs TypeScript directly (no build step).

```bash
# Build from repo root
docker build -f Dockerfile.server -t vidos-server .

# Run
docker run -p 3000:3000 \
  -e VIDOS_AUTHORIZER_URL=https://your-authorizer.com \
  -e VIDOS_API_KEY=your-key \
  vidos-server
```

**Dokploy/Coolify config:**

- Build context: repo root
- Dockerfile: `Dockerfile.server`
- Env vars: `VIDOS_AUTHORIZER_URL` (required), `VIDOS_API_KEY` (optional)

### Client (GitHub Pages)

Static build deployed via GitHub Actions.

```bash
bun run build:client  # outputs to client/dist/
```

Set `VITE_VIDOS_DEMO_BANK_SERVER_URL` to the deployed server URL at build time.
