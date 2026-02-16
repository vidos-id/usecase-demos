# Vidos Use Case Demos

A demo banking application showcasing **EU Digital Identity (EUDI) Wallet** integration for identity verification, KYC, and payment authentication. Built with [Vidos](https://vidos.id/) verification infrastructure.

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
