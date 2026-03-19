## 1. Package Restructure

- [x] 1.1 Restructure `usecases/car-rental/` into `web/`, `mcp/`, and `shared/` packages with workspace wiring aligned to the pragmatic `demo-bank` pattern
- [x] 1.2 Move shared car inventory resources into `usecases/car-rental/shared/` and keep vehicle definitions location-agnostic
- [x] 1.3 Define shared schemas and inferred types in `usecases/car-rental/shared/` using focused Zod modules instead of hand-maintained duplicate interfaces
- [x] 1.4 Update the existing `web` package to consume shared cars and shared types from `usecases/car-rental/shared/`

## 2. MCP Search and Booking Flow

- [x] 2.1 Create the MCP package structure for server bootstrap, tool modules, booking state, UI resource registration, and widget code
- [x] 2.2 Implement model-visible rental search that accepts destination and trip context and returns text-first ranked car results with rich structured data for the agent
- [x] 2.3 Implement model-visible car selection and booking-context creation with explicit booking session IDs and authoritative snapshots
- [x] 2.4 Implement booking initiation that computes age and licence requirements for the selected vehicle in one server action

## 3. Verification and Eligibility

- [x] 3.1 Implement the MCP-local Vidos client and request modeling for PID plus mDL verification using patterns adapted from the existing car-rental flow
- [x] 3.2 Implement booking-linked verification lifecycle state and async status monitoring for pending, processing, success, rejected, expired, and error states
- [x] 3.3 Normalize authorizer outputs into rental eligibility results including minimum-age evaluation, licence-category matching, licence validity, and overall booking approval
- [x] 3.4 Return clear machine-readable and agent-readable failure reasons for underage, category mismatch, expired licence, and authorizer errors

## 4. MCP App Verification UI

- [x] 4.1 Register a single MCP App resource used only for verification and post-verification success or confirmation states
- [x] 4.2 Build the verification widget as a React single-file bundle with QR or wallet-launch handoff and app-only polling tools
- [x] 4.3 Implement a high-visibility proof-success state that makes the accepted driving licence obvious to demo viewers
- [x] 4.4 Ensure all MCP tools still provide strong plain-text fallbacks so search and booking remain usable without UI rendering

## 5. Confirmation and Demo Finish

- [x] 5.1 Implement deterministic fake pickup fulfillment details including booking reference, locker or keybox identifier, PIN, and short pickup instructions
- [x] 5.2 Expose the same confirmation payload to both the agent responses and the MCP App resource so transcript and widget stay aligned
- [x] 5.3 Keep the success widget visible after approval so the proof-success moment remains obvious while the agent delivers the final booking confirmation

## 6. Docs and Validation

- [x] 6.1 Update car-rental documentation to explain the new `web/`, `mcp/`, and `shared/` package structure and shared typing approach
- [x] 6.2 Add or update home-navigation and demo guidance so the MCP car-rental flow is discoverable and understandable
- [ ] 6.3 Validate the MCP package locally with MCP Inspector and verify the text-first search, verification widget, and final confirmation flow end to end
- [x] 6.4 Run relevant type-check and workspace validation commands and fix any issues introduced by the package restructure
