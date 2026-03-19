## Why

The repo already has a frontend-first `usecases/car-rental/` demo and an MCP-first `usecases/mcp-wine-agent/` demo, but it does not yet show how a conversational AI agent can drive a car-rental booking flow with wallet-backed license verification. Adding that bridge creates a stronger demo story, and reorganizing car-rental into simple `web/`, `mcp/`, and `shared/` packages keeps the demo maintainable while both app surfaces reuse the same fleet data and light domain logic.

## What Changes

- Reorganize `usecases/car-rental/` into a simple multi-package use case similar to `usecases/demo-bank/`, with a `web` package, an `mcp` package, and a `shared` package.
- Add a new MCP-first AI demo package for car rental, following the text-first interaction model proven in `usecases/mcp-wine-agent/` while keeping the existing browser experience as its own `web` package rather than converting it into a hybrid MCP app.
- Expose MCP tools for searching rental inventory by destination and trip context, selecting a vehicle, starting booking, and checking booking or verification state.
- Extract car inventory resources and a small amount of shared rental logic into a pragmatic shared package consumed by both the `web` app and the `mcp` app.
- Define shared package types the same pragmatic way as `usecases/demo-bank/shared/`: Zod schemas as the source of truth with inferred TypeScript types exported from focused modules.
- Keep car search and listing text-first in the agent response, and limit the MCP App UI resource to the verification step and its high-visibility success state.
- Start checkout from the selected vehicle and derive verification requirements from the vehicle and rental policy, including age threshold and driving-license capability checks.
- Reuse the Vidos authorization pattern already established in `usecases/car-rental/` to request the minimum PID + mDL claims needed for booking eligibility.
- Return a final agent-driven confirmation that acknowledges the booking, explains the successful verification outcome, and provides a fake locker/key pickup handoff for demo impact.

## Capabilities

### New Capabilities
- `mcp-car-rental-search-and-selection`: Agent-facing rental search, result ranking, text-only car presentation, and server-side booking context for the MCP car-rental flow.
- `mcp-car-rental-verification`: Vehicle-aware eligibility verification using Vidos, including PID + mDL request modeling, status tracking, and booking approval or rejection.
- `mcp-car-rental-chatgpt-ui`: ChatGPT widget behavior for QR-based wallet verification and a high-visibility post-verification success state during booking.
- `mcp-car-rental-confirmation`: Post-verification booking completion, agent messaging, and fake key-locker pickup details.

### Modified Capabilities
- _(none)_

## Impact

- `usecases/car-rental/` becomes a small multi-package use case, likely with `web/`, `mcp/`, and `shared/` workspaces.
- The new shared package becomes the source of truth for car inventory resources and simple shared rental schemas, types, and helpers used by both app surfaces.
- The MCP app package adds tool contracts, booking state models, and `@modelcontextprotocol/ext-apps` resource registration similar to `usecases/mcp-wine-agent/`.
- The `web` package is updated to consume the shared package instead of owning all car resources directly.
- Home-navigation/docs updates will be needed so the demo structure and MCP flow are discoverable and explainable.
