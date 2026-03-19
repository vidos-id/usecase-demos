## Context

This change adds a new MCP-first car-rental demo under `usecases/`, while also reshaping `usecases/car-rental/` into a simple multi-package use case more like `usecases/demo-bank/`. The current repo already proves two important pieces independently: `usecases/car-rental/` shows the underlying rental and mDL verification domain, while `usecases/mcp-wine-agent/` shows the MCP Apps pattern for text-first agent flows with a compact inline widget.

The new demo should combine those ideas without turning the existing car-rental SPA into a hybrid MCP app. Most of the journey should stay in chat: the agent understands destination intent, narrates choices, praises the selected car, starts booking, and confirms pickup details. To keep the story simple and investor-friendly, the MCP widget should be limited to the verification step and an obvious post-verification success state that showcases what driving-licence proof was accepted.

Key constraints:
- use a pragmatic package split inside `usecases/car-rental/`, not an overengineered shared-domain extraction
- keep separate `web` and `mcp` packages rather than converting the existing web app into a hybrid runtime
- MCP App architecture must follow the `tool + resource` pattern from `@modelcontextprotocol/ext-apps`
- widget HTML should be built as a bundled single-file resource for host rendering
- shared package contents should stay small: car resources, shared schemas/types, and only lightweight helpers that genuinely benefit both app surfaces
- the first host target is ChatGPT-compatible MCP environments, with text fallback preserved for non-UI hosts

## Goals / Non-Goals

**Goals:**
- Reorganize the car-rental use case into package boundaries similar to `usecases/demo-bank/`: `web`, `mcp`, and `shared` packages.
- Expose a small MCP tool surface for rental search, car selection, booking initiation, and booking or verification status lookup.
- Keep car discovery and listing text-only in the agent response while using the MCP App UI only for verification and a strong post-verification proof-success state.
- Reuse the Vidos-based PID + mDL verification model from the existing car-rental flow, extended with vehicle-specific eligibility checks such as required licence category and minimum driver age.
- Keep shared fleet resources and basic rental metadata in one lightweight shared package while authoritative booking, verification, and fake pickup state stay in the MCP server.
- Ensure the agent can resume naturally after widget interaction, especially after a car is selected and after verification reaches a terminal state.

**Non-Goals:**
- Converting `usecases/car-rental/` into a hybrid standalone + MCP app.
- Building a full browser storefront or reproducing the entire existing car-rental SPA inside the host iframe.
- Moving all booking or verification logic into the shared package.
- Real vehicle inventory, payment processing, key management, or fulfillment integrations.
- Multi-host optimization beyond the minimum needed for ChatGPT-compatible MCP App behavior in v1.
- Persistent database storage if in-memory demo state is sufficient.

## Decisions

### Use a pragmatic multi-package structure inside `usecases/car-rental/`

The car-rental use case should adopt a structure similar to `usecases/demo-bank/`, with separate packages for the `web` app, the `mcp` app, and a shared package. A practical target shape is:
- `usecases/car-rental/web/` for the browser app
- `usecases/car-rental/mcp/` for the MCP server and MCP App widget
- `usecases/car-rental/shared/` for shared car resources, shared schemas, and lightweight helpers

This keeps both app surfaces close to each other, makes ownership clearer, and gives the new MCP package a clean place to live without forcing the existing SPA into hybrid runtime behavior.

Alternatives considered:
- Create a completely separate top-level workspace like `usecases/mcp-car-rental-agent/`: rejected because the user wants a package structure closer to `demo-bank`, and colocating both surfaces with one shared package is simpler for this demo.
- Convert the `web` package with the hybrid web-app pattern: rejected because the desired MCP journey is not “the same app inline”; it is a more focused agent-first experience with only two UI moments.

### Extract fleet data and minimal shared rental logic into a `shared/` package

The shared package should become the source of truth for the reusable car-rental resources that both surfaces need. At minimum, it should hold:
- car inventory records and related asset references or public asset paths
- shared Zod schemas and inferred types for vehicles, booking snapshots, and MCP payloads that are exchanged across package boundaries
- only lightweight helpers such as price estimation or display-safe normalization when both packages truly use them

The shared package should follow the same pragmatic typing pattern used in `usecases/demo-bank/shared/`: define focused Zod schemas per module and export inferred TypeScript types from those schemas, instead of hand-maintained duplicated interfaces.

This extraction should stay intentionally small. Stateful booking flows, Vidos integration, authorization monitoring, and host-specific widget logic should remain in the package that owns that behavior.

Alternatives considered:
- Keep fleet data owned only by the `web` package and copy it into the MCP package: rejected because this would create fast drift in a demo with visually important inventory.
- Move all booking and verification logic into `shared/`: rejected because it would overcomplicate a demo and blur package responsibilities.

### Use a Bun + TypeScript MCP server with `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps`

The MCP package should follow the same overall shape as `usecases/mcp-wine-agent/`: Bun-hosted Streamable HTTP transport, small tool modules, and MCP App resource registration through `registerAppTool` and `registerAppResource`. It should import shared fleet data and shared schemas from `usecases/car-rental/shared/`, while keeping booking-session and verification runtime state local to the MCP package.

Alternatives considered:
- `tsx` + Node-first server setup from generic SDK examples: useful generally, but rejected as the default here because the repo already has a Bun-based MCP reference that better fits local conventions.
- A fuller server framework such as Express or Hono: rejected because the transport and helper endpoints are small enough for Bun's native server.

### Build the widget as a React MCP App resource with a single-file bundle

The UI resource should use React, because both the current car-rental app and `usecases/mcp-wine-agent/widget/` already establish React component patterns that fit this repo well. The widget build should use Vite plus `vite-plugin-singlefile` so the MCP App resource can be served as a single bundled HTML document. Resource metadata such as `_meta.ui.csp` and optional `_meta.ui.domain` should be attached to the returned `contents[]` payload, matching ext-apps requirements.

Alternatives considered:
- Vanilla JS widget: rejected because the card selection and multi-state verification UI benefit from existing React patterns.
- Reusing the exact wine widget bundle: rejected because the car-rental flow needs different card layouts, richer vehicle state, and vehicle-specific verification messaging.

### Limit the MCP App resource to verification and proof-success UI only

The demo should keep rental search results and car listing entirely in agent text. The MCP App resource should appear only once booking requires wallet verification, and it should stay focused on QR handoff, verification progress, and a highly visible proof-success state after driving-licence verification completes. Search results returned to the model should include rich structured data so the agent can still compare cars clearly in text.

Alternatives considered:
- Search-results widget with clickable car cards: rejected because the simplified investor-focused story works better when discovery stays conversational and the only custom UI is the trust-critical verification moment.
- No UI at all: rejected because QR handoff and proof-success are much clearer when rendered visually.

### Split tool visibility between model-facing tools and app-only helper tools

Model-facing tools should cover the business actions the agent reasons about, for example `search_cars`, `select_car`, `start_booking`, and `get_booking_status`. App-only tools should support widget refresh and verification polling that the model does not need to call directly. This follows the MCP App pattern where the widget can call `app.callServerTool()` without overloading the model-visible tool surface.

Recommended shape:
- model-visible: search rentals, select car, start booking, get booking status
- app-only: refresh verification state, refresh confirmation state

Alternatives considered:
- Hide selection behind widget-only actions: rejected because the simplified text-first search flow means the model should own car selection from the user's conversational choice.
- Keep all state client-side in the widget: rejected because the agent also needs authoritative state to narrate the flow correctly.

### Keep state server-side with explicit booking and verification session IDs

The server should own the authoritative rental session. Search results, selected vehicle, verification state, and final pickup details should live in server-side in-memory stores keyed by explicit IDs such as `bookingSessionId` and `verificationSessionId`. Tool calls and app-only tool calls should always return fresh authoritative snapshots.

This avoids coupling business state to MCP transport sessions or widget-local state and mirrors the explicit cart/checkout identity pattern already used by `usecases/mcp-wine-agent`.

Alternatives considered:
- Implicit per-chat state only: rejected because explicit IDs are easier to debug and safer across host/tool turns.
- Database-backed persistence in v1: rejected because the demo is additive and restart-safe in-memory state is enough initially.

### Start booking as a single server action that also computes verification requirements

When the user says “book it”, the model-facing booking tool should create or advance a booking session, inspect the selected vehicle, and compute the required trust checks in one step. The booking response should include whether verification is required, the minimum age for the vehicle class, the required licence category, and, when needed, the newly created Vidos authorization context.

This keeps the agent flow tight: the agent does not have to separately ask which checks apply before starting checkout.

Alternatives considered:
- A separate “check rental requirements” tool before booking: rejected because it adds an unnecessary agent step and weakens the demo pacing.

### Use PID + mDL verification with vehicle-aware policy evaluation

The existing `usecases/car-rental/` demo already requests mDL claims and validates licence privileges. The MCP demo should reuse that conceptual model, but expand it to match the conversational story:
- PID contributes identity and age data needed for minimum-age checks.
- mDL contributes licence validity, expiry, and driving privileges.
- server-side policy evaluation determines whether the selected car can be booked.

The authorization request should ask only for the claims required to explain the outcome and render the confirmation, for example:
- PID: given name, family name, birth date, optional portrait
- mDL: document number, expiry date, driving privileges, issuing authority/country if needed, optional portrait

The booking result should normalize this into a stable eligibility summary with fields such as `minimumAgeMet`, `requiredLicenceCategory`, `presentedCategories`, `licenceValid`, and `bookingApproved`.

Alternatives considered:
- mDL-only verification: rejected because the requested flow explicitly includes age verification based on the selected car.
- Pure authorizer pass/fail with no normalized explanation: rejected because the demo needs clear agent narration and final confirmation details.

### Keep inventory location-agnostic and apply destination at search time

Vehicle definitions in the shared package should not be tied to a single fixed pickup location like Frankfurt Airport. Cars should be modeled as generic rental inventory records, while the user-requested destination is treated as search or booking context supplied at runtime. This keeps the demo flexible for prompts like Tenerife without over-modeling per-location fleet logistics.

Alternatives considered:
- Keep location baked into every vehicle record: rejected because the user wants the same fleet to adapt to whatever destination the user requests.
- Build full per-location inventory management: rejected because it adds unnecessary complexity for a demo.

### Use server-driven monitoring plus widget-driven host re-entry after verification

After booking starts and an authorization is created, the server should monitor Vidos status asynchronously, similar to the proven pattern in the wine agent and existing repo demos. The widget should poll a lightweight app-only status tool while the QR is visible. When verification completes, the widget should trigger host re-entry so the model gets a fresh turn and can congratulate the user and continue the booking narrative.

This pattern keeps the UI responsive while preserving the text-first experience.

Alternatives considered:
- Long-running blocking tool calls until wallet completion: rejected because wallet completion timing is unpredictable and bad for host UX.
- Client-only polling with no server monitor: rejected because verification lifecycle ownership should stay on the server.
- Rely on the user to manually type another message after every widget action: rejected because it makes the demo feel brittle.

### Keep post-verification success highly visible in the widget

Once verification succeeds, the widget should not collapse immediately. It should switch from QR state into a high-visibility success presentation that makes the accepted driving-licence proof obvious to observers, for example by prominently showing verification success, confirmed licence category, and key disclosed licence details before or alongside the final pickup handoff.

Alternatives considered:
- Close the widget immediately after verification success: rejected because the demo is meant to impress investors with the visible proof outcome.
- Leave success only to the agent text response: rejected because the proof moment should remain visually obvious.

### Generate fake pickup fulfillment only after booking approval

Once verification succeeds and the server marks the booking approved, the server should generate deterministic fake fulfillment details such as booking reference, pickup counter or locker zone, locker ID, PIN, and a short pickup instruction string. These details should appear in both the widget confirmation state and the model-facing completion message.

Alternatives considered:
- Hardcode one static pickup message for all bookings: rejected because varying output makes the demo feel more credible.
- Add a separate fulfillment tool: rejected because fake pickup generation is part of booking completion, not a user-driven action.

### Keep package boundaries and modules ownership-based

The overall use case should mirror the simple separation used in `demo-bank`, while each package keeps focused modules.

Recommended shape:
- `web/`: routes, UI components, browser-only booking flow
- `mcp/`: MCP server/bootstrap, tool registration modules, booking and verification services, Vidos client, UI resource registration, widget components
- `shared/`: cars, shared schemas, shared types, small helpers

Each tool module should own its input schema and registration so schema drift is minimized.

Alternatives considered:
- Monolithic server file with embedded tool definitions: rejected because the flow spans search, selection, booking, verification, and confirmation.

## Risks / Trade-offs

- [Widget-to-agent continuation may vary by host behavior] -> Mitigate by pairing host re-entry with server-side status visibility and a widget confirmation fallback.
- [Vehicle inventory and display data may drift between regular web and MCP app] -> Mitigate by moving cars into the shared package as the source of truth.
- [Vehicle-specific policy rules may drift from the `web` flow] -> Mitigate by documenting a single normalized eligibility model and deriving demo policies from shared conceptual rules rather than ad hoc strings.
- [In-memory state will be lost on restart] -> Mitigate by scoping v1 to live demo sessions and keeping state shapes ready for later persistence.
- [PID + mDL request complexity can make failures harder to explain] -> Mitigate by normalizing authorizer output into explicit failure reasons such as underage, category mismatch, expired licence, or authorizer error.
- [MCP App resource loading can fail silently if CSP is wrong] -> Mitigate by keeping the widget bundle self-contained, minimizing external origins, and attaching CSP metadata in the resource `contents[]` response.
- [Too much UI could weaken the “agent-first” story] -> Mitigate by keeping search and car comparison text-only and limiting custom UI to verification plus visible proof-success.

## Migration Plan

1. Restructure `usecases/car-rental/` into `web/`, `mcp/`, and `shared/` packages with workspace wiring similar to `demo-bank`.
2. Move cars and minimal shared rental schemas or helpers into `usecases/car-rental/shared/`, following the Zod-plus-inferred-types pattern used in `demo-bank/shared`.
3. Update the `web` package to consume the shared package for fleet resources.
4. Implement the MCP package with rental inventory consumption, conversational selection flow, booking-session state, and model-visible MCP tools with text-only search results.
5. Add MCP App resource registration, widget asset serving, and app-only helper tools only for verification-state refresh.
6. Port the necessary Vidos integration ideas into MCP-local modules, including PID + mDL request modeling, status monitoring, and eligibility normalization.
7. Add a highly visible post-verification success state plus booking confirmation output with fake pickup details, update docs/navigation, and validate with MCP Inspector and the intended ChatGPT-compatible host flow.

Rollback is still straightforward because the shared extraction is limited in scope: the main rollback path is to move shared resources back into the `web` package and remove the MCP package if needed.

## Open Questions

- _(none for v1)_
