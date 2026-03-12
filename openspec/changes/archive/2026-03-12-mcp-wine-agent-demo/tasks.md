## 1. Workspace Setup

- [x] 1.1 Create a new Bun + TypeScript workspace for the MCP wine demo under `usecases/`
- [x] 1.2 Add MCP, ChatGPT Apps, and Zod dependencies plus workspace scripts for local run/check
- [x] 1.3 Create the initial small-file module structure for server bootstrap, tools, domain services, schemas, and UI resource registration

## 2. Shopping Tools

- [x] 2.1 Define type-safe wine catalog, cart, checkout, and tool response schemas
- [x] 2.2 Copy the wine catalog from `usecases/wine-shop/`, enrich it with a bit more wine metadata, and implement the catalog/recommendation MCP tool with simple ranked matching instead of strict exact-only filtering
- [x] 2.3 Implement cart mutation and cart summary MCP tools with authoritative server-side state and explicit `cartSessionId` reuse across later calls
- [x] 2.4 Implement checkout initiation that detects age-restricted products, creates authorization immediately, and enters verification-required state

## 3. Vidos Verification Flow

- [x] 3.1 Implement the Vidos API client for authorization creation, status lookup, policy response, and credentials retrieval
- [x] 3.2 Build the DCQL request for `dc+sd-jwt` PID credentials using only the `age_equal_or_over.18` proof, with holder binding and Vidos default nonce handling
- [x] 3.3 Implement checkout-linked authorization session creation and QR-ready verification payloads
- [x] 3.4 Implement the internal authorization monitor that polls Vidos and processes terminal states
- [x] 3.5 Implement simple PID claim extraction and age eligibility evaluation for the SD-JWT PID response without adding unnecessary normalization layers
- [x] 3.6 Implement verification status lookup tools that expose both checkout status and lower-level authorization status

## 4. ChatGPT UI and Agent Messaging

- [x] 4.1 Register the minimal ChatGPT UI resource for QR rendering using a static output template, ChatGPT widget metadata (CSP/domain), and wine-shop branding cues such as color and logo treatment
- [x] 4.2 Ensure tool outputs include agent-readable text for pending, success, rejected, expired, and error outcomes
- [x] 4.3 Keep product discovery and purchase guidance in text-first tool responses rather than custom storefront UI
- [x] 4.4 Poll verification status from the widget and send a host follow-up message so the agent can resume automatically after wallet completion
- [x] 4.5 Add a Vinos-branded post-verification payment and confirmation fallback in the widget while hiding QR/wallet actions after verification succeeds

## 5. Integration and Validation

- [x] 5.1 Add the new demo entry to `usecases-home/` with concise description and link
- [x] 5.2 Document local setup, ChatGPT connector usage, Streamable HTTP MCP endpoint details, and expected verification flow in the demo README
- [x] 5.3 Validate the MCP server locally with MCP Inspector and verify the ChatGPT-targeted flow end to end
- [x] 5.4 Run workspace checks relevant to the new demo and fix any type or lint issues
