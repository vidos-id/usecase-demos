# Demo Bank Use Case

Demo bank is a full-stack reference app showing EUDI Wallet + Vidos integration for banking flows.

## Workspaces

- `client/` (`demo-bank-client`) - React + Vite frontend
- `server/` (`demo-bank-server`) - Hono API backend
- `shared/` (`demo-bank-shared`) - shared Zod schemas/types

## What It Demonstrates

- PID-based identification and KYC onboarding
- Wallet-based signin/signup
- Credential-driven loan and payment authorization
- SSE-driven authorization waiting (no polling loops)

## Local Commands (from repo root)

- `bun run dev:demo-bank-client`
- `bun run dev:demo-bank-server`
- `bun run build:demo-bank-client`
- `bun run check-types`
