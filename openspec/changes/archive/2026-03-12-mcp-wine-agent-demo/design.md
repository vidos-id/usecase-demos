## Context

This change introduces a new MCP-first demo under `usecases/` that adapts the existing wine-shop verification story to an AI-agent workflow. The current repo already contains proven Vidos integration patterns in `usecases/demo-bank/`, `usecases/car-rental/`, and `usecases/wine-shop/`, including authorization creation, status lookup, policy-response retrieval, and credential extraction.

The new demo targets ChatGPT first, using the Apps SDK and Model Context Protocol. Most user interaction should remain in the chat transcript as plain text. The only custom UI that materially improves the flow is a minimal QR presentation surface during wallet verification.

Key constraints:
- Bun + TypeScript
- Small, focused files
- Strong runtime and compile-time typing
- No unnecessary web framework beyond what is needed to expose MCP over HTTP
- ChatGPT is the only target host for v1

## Goals / Non-Goals

**Goals:**
- Expose a small set of MCP tools that let an AI agent browse wines, manage a cart, begin checkout, and query verification state.
- Reuse the established Vidos Authorizer flow for age-gated checkout.
- Provide a minimal QR-code UI resource for wallet presentation inside ChatGPT.
- Keep authoritative shopping and verification state on the server and return structured snapshots after tool calls.
- Make the initial version work reliably in ChatGPT even if no host-driven webhook or push completion mechanism is available.

**Non-Goals:**
- Building a rich storefront UI for products, filters, or checkout.
- Real payment processing, inventory management, or order fulfillment.
- Generalizing the demo for every MCP host in v1.
- Introducing a database if in-memory state is sufficient for the demo.

## Decisions

### Use a minimal Bun HTTP server with the MCP TypeScript SDK and Streamable HTTP transport

The server will use Bun's native HTTP serving plus `@modelcontextprotocol/sdk` over Streamable HTTP transport. This keeps the runtime simple, works with public ChatGPT MCP endpoints, and matches the repo preference for small focused modules.

Alternatives considered:
- Hono or Express: useful routing ergonomics, but unnecessary for the small number of endpoints and MCP transport handling needed here.
- Separate frontend app: rejected because product browsing should stay chat-native and only QR rendering benefits from custom UI.

### Model the demo around MCP tools plus one compact branded UI resource

The core user journey will be text-first. Tools return structured content for wines, cart state, checkout readiness, and verification status. A single lightweight static UI resource will be registered for the verification and immediate post-verification step, rendering a Vinos-branded QR experience first and then a compact payment/confirmation view after age verification completes, all from tool output inside ChatGPT rather than relying on a one-off server-rendered HTML payload per checkout session.

Alternatives considered:
- Full MCP app UI for catalog and checkout: rejected to keep the agent experience simple and aligned with the proposal update.
- No UI at all: rejected because QR presentation is materially better when rendered visually.

### Keep the widget useful after verification completes

Because ChatGPT follow-up messaging may not always produce the ideal agent continuation in every host/runtime situation, the widget should remain useful after verification succeeds. It should hide the QR and wallet-launch affordances, keep the agent follow-up trigger, and reveal a small Vinos-branded payment form plus order success state so the demo can still reach a satisfying end state even if the chat does not immediately continue.

Alternatives considered:
- Close the widget immediately after verification: rejected because it can make the flow feel abrupt and gives no fallback if agent continuation lags.
- Keep showing the QR after verification: rejected because it suggests the user still needs to scan and creates confusion.

### Keep business state server-side and return authoritative snapshots

Following Apps SDK state guidance, wine catalog data, cart contents, checkout session state, and Vidos authorization state should live on the MCP server. Each mutating tool call should return the new authoritative snapshot so the model and widget stay in sync.

Alternatives considered:
- Store cart state in widget-only state: rejected because the model also needs to reason over cart and checkout state.
- Persist to a database immediately: rejected for v1 simplicity unless session durability becomes necessary.

### Reuse the Vidos integration pattern already established in repo demos

The design will mirror existing flows: create authorization via `POST /openid4/vp/v1_0/authorizations` using a DCQL query for an SD-JWT PID credential, poll authorization status, and on terminal success fetch policy response and disclosed credentials. The actual claim request should be minimized to `age_equal_or_over.18` on `urn:eudi:pid:1`, with cryptographic holder binding required. The same domain concepts should be reused where possible: authorization lifecycle state and age eligibility evaluation.

Alternatives considered:
- New callback-specific backend flow first: rejected for v1 because current ChatGPT host integration certainty is strongest around explicit re-query.
- Host-specific shortcuts that bypass Vidos lifecycle modeling: rejected because they would weaken reuse across demos.

### Keep cart identity explicit, not transport-derived

The shopping flow should use an explicit `cartSessionId` returned by `add_to_cart` and then reused by `get_cart`, `remove_from_cart`, and `initiate_checkout`. The implementation should not rely on MCP transport session identity or hidden default carts, because ChatGPT transport/session behavior is not the right business-state boundary.

Alternatives considered:
- Implicit default cart: rejected because it hides state and makes tool chaining less explicit.
- Deriving cart identity from HTTP/MCP session: rejected because transport session lifecycle is not guaranteed to match the chat/business session.

### Merge checkout initiation with authorization start

When a cart contains age-restricted wine, `initiate_checkout` should immediately create the Vidos authorization and return verification-required state plus the authorization URL and QR-ready data. A separate `start_verification` tool is unnecessary and makes the agent flow harder.

Alternatives considered:
- Separate checkout and verification-start tools: rejected because it adds unnecessary agent steps and makes widget activation less reliable.

### Use server-driven internal polling with widget-driven host re-entry

After checkout creates a Vidos authorization, the server should start an internal monitor that polls Vidos on a fixed cadence and completes processing when a terminal state is reached, following the same general pattern as `usecases/demo-bank/server/src/services/authorization-monitor.ts`. MCP tools should expose the latest processed state through `get checkout status` or `get verification status`, while the ChatGPT widget should poll that MCP tool and, on terminal completion, send a follow-up host message so the agent receives a fresh turn and can continue the conversation automatically.

This decision is based on current constraints:
- ChatGPT Apps reliably supports tool calls and widget refresh behavior.
- Internal polling keeps authorization processing centralized and makes future push-style updates easier if ChatGPT capabilities improve.
- ChatGPT does not provide a simple server-side push directly into the active model turn, so widget-to-host re-entry is the most reliable automatic continuation mechanism.
- The existing bank use case already demonstrates the monitor pattern needed here.

Alternatives considered:
- Client-side-only polling via repeated MCP tool calls: rejected because the server should own authorization processing and state transitions.
- Long-running blocking tool calls until wallet completion: rejected because verification may take unpredictable time and degrade UX.
- Server-only push into the model with no widget or new host event: rejected because current ChatGPT app behavior is more reliable when the widget sends `ui/message` to create the next turn.

### Use tool-local registration and schema ownership

Each tool module should own its Zod input schemas and its registration helpers (for example `registerGetCartTool(server)`) so the server bootstrap stays small and the same schema is not duplicated between the registry and implementation layers.

Alternatives considered:
- Centralized duplicated tool schema registry in `server.ts`: rejected because it caused drift and duplication.

### Organize code by focused modules, not by transport details alone

The workspace should separate concerns into small files such as:
- MCP server/bootstrap
- tool registrations
- shopping domain models and service
- verification domain models and service
- Vidos API client
- UI resource registration
- shared schemas/parsers

This preserves type safety while keeping files small and easy to reason about.

Alternatives considered:
- Single-file MCP server example structure: rejected because it does not fit the repo's maintainability goals.

## Risks / Trade-offs

- [Async verification completion may feel manual] -> Mitigate by using server-driven monitoring plus widget-side polling and host re-entry, so the agent gets a fresh turn without asking the user to manually prompt again.
- [In-memory state is fragile across restarts] -> Mitigate by scoping v1 to demo sessions and isolating state shapes so SQLite or another store can be added later without changing tool contracts.
- [ChatGPT-specific UI bindings may reduce portability] -> Mitigate by keeping UI optional and thin; core behavior remains tool-driven and host-agnostic.
- [Vidos API response shapes may differ across demos] -> Mitigate by extracting shared normalization helpers and validating all external responses with Zod.
- [Too many MCP tools can confuse tool selection] -> Mitigate by keeping the initial tool surface small and purpose-built.
- [ChatGPT widget behavior may be sensitive to metadata/template shape] -> Mitigate by using a static registered template, explicit `structuredContent`, Apps SDK-compatible resource metadata, and debug logging around tool/resource flow.
- [Agent continuation may not always feel deterministic after wallet completion] -> Mitigate by keeping the host follow-up message path and providing an in-widget payment/confirmation fallback so the demo still completes cleanly.

## Migration Plan

1. Create the new workspace and wire Bun + TypeScript + MCP dependencies.
2. Implement the shopping domain and tool contracts with mocked wine data, explicit cart IDs, and ranked search output.
3. Integrate Vidos authorization creation and status/credential retrieval using existing repo patterns, but request only `age_equal_or_over.18` from the PID credential.
4. Add the minimal QR UI resource as a static ChatGPT widget template and bind it only to the verification step.
5. Add home navigator entry and demo documentation.
6. Validate locally with MCP Inspector and ChatGPT connector flow.

Rollback is straightforward because this is a new additive demo workspace and home entry; reverting the new workspace and navigation link removes the feature.

## Open Questions

- Confirm whether the final ChatGPT deployment should keep the inline QR widget only, or also support opening the same template in a modal later.
