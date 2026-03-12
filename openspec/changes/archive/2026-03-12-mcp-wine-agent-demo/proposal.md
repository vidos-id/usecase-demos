## Why

The repo already demonstrates age-gated wine checkout in a traditional web app, but it does not yet show how the same verification pattern works when an AI agent drives the shopping flow through MCP. Adding an MCP-first wine buying demo creates a strong, current showcase for ChatGPT: the agent can recommend products, start checkout, request a minimal 18+ proof through Vidos, and explain the result back to the user.

## What Changes

- Add a new Bun + TypeScript MCP server demo for agent-driven wine shopping, separate from the existing `usecases/wine-shop/` browser app.
- Expose MCP tools for listing wines, filtering by user intent, managing a cart, starting checkout, and checking checkout state.
- Add an age-gated checkout flow that detects alcohol in the cart and requires an SD-JWT PID-based `age_equal_or_over.18` proof before purchase can complete.
- Reuse the established Vidos authorization pattern from existing demos to create authorization requests, fetch status, and read disclosed credential data.
- Provide a Vinos-branded ChatGPT-compatible MCP UI resource that starts as a QR verification surface, then transitions into a compact payment and order-confirmation experience while keeping product discovery, recommendations, instructions, and most checkout messaging in the chat text flow.
- Use ChatGPT-compatible MCP Apps resource metadata (`_meta.ui.resourceUri`, output template metadata, widget CSP, widget domain) so the QR widget can render inside ChatGPT.
- Define a host-compatible completion pattern for authorization state updates, with widget-side status polling and a ChatGPT follow-up message that re-invokes the agent once verification completes.
- Keep the implementation small, modular, and type-safe, with focused files and Bun-hosted Streamable HTTP MCP transport rather than stdio.

## Capabilities

### New Capabilities
- `mcp-wine-shopping`: Agent-facing wine catalog, recommendation inputs, cart management, and checkout initiation tools.
- `mcp-wine-verification`: Vidos authorization creation, QR-code-ready verification payloads, authorization status lookup, and 18+ eligibility evaluation from PID claims.
- `mcp-wine-chatgpt-ui`: Minimal ChatGPT-rendered MCP app UI for QR code presentation using a registered static widget template fed by tool output.

### Modified Capabilities
- _(none)_

## Impact

- New workspace under `usecases/` for the MCP server demo and any small supporting UI assets.
- New home-navigation entry in `usecases-home/` so the demo is discoverable alongside existing use cases.
- New dependencies centered on `@modelcontextprotocol/sdk`, `zod`, `qrcode`, and Bun/TypeScript runtime tooling.
- Reuse of existing Vidos Authorizer API integration patterns already proven in `usecases/demo-bank/`, `usecases/car-rental/`, and `usecases/wine-shop/`.
- No required adoption of an extra server framework at proposal time; a minimal Bun HTTP server plus MCP SDK should remain the default unless a later design artifact justifies additional infrastructure.
