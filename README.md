# Vidos Use Case Demos

This repository hosts multiple example apps showing how to integrate EUDI Wallet flows with Vidos.

## Purpose

- Keep real, runnable reference implementations for different verticals in one monorepo.
- Share common infrastructure/deployment patterns while allowing each use case to evolve independently.
- Provide practical examples for identity verification, authentication, and credential-based user journeys.

## Repository Layout

```text
usecases-home/       # Homepage + navigator for all demos
usecases/
  demo-bank/
    client/          # React + Vite app
    server/          # Hono API server
    shared/          # Shared Zod schemas/types
infrastructure/      # Pulumi infra for deployments
.github/workflows/   # CI/CD workflows
```

## Available Use Cases

### Use Cases Home

Homepage and navigator for all demos, with rough guidance on setup and usage.

- Source: `usecases-home/`
- Includes: demo navigation, wallet download/setup, credential issuance hints, and general Vidos information

### Demo Bank

A banking-focused sample for PID verification, KYC onboarding, and payment/loan authorization.

- Live demo: https://eudi-usecase.demo.vidos.id/
- Source: `usecases/demo-bank/`

## Commands

- `bun run build` - Build workspace apps (client build pipeline)
- `bun run check-types` - Type-check all workspaces
- `bun run lint` - Lint repo with Biome
- `bun run format` - Format repo with Biome

## Deployment

- Infrastructure is managed from `infrastructure/` with Pulumi.
- CI/CD is defined in `.github/workflows/deploy.yml`.
- Server container build uses `Dockerfile.server` at repo root.
