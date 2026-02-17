## Why

Developers and demo viewers currently have limited visibility into what the server is doing during authorization and related flows, which makes failures harder to debug and weakens live product demonstrations. A dedicated SSE debug stream with console-like events enables fast diagnosis and clearer showcase storytelling directly in the client.

## What Changes

- Add a dedicated server-to-client SSE debug stream for server-side events relevant to authorization and related requests.
- Add client UI for a console-like log panel that subscribes to the debug stream and renders structured, timestamped events.
- Define typed debug event schemas in `shared` so payloads are validated and strongly typed end-to-end.
- Include moderately verbose event content (request lifecycle transitions, upstream calls, validation failures, state changes) suitable for demo/debug use.
- Keep debug stream separated from business status streams so core authorization/callback SSE flows remain focused and maintainable.

## Capabilities

### New Capabilities

- `sse-debug-event-console`: Stream structured server debug events to the client and render them in a console-like viewer for debugging and showcase scenarios.

### Modified Capabilities

- `authorization-and-callback-sse`: Introduce reusable SSE transport primitives (envelope, serializer, routing/channel composition) that can be shared by both business status streams and debug streams without coupling payload semantics.

## Impact

- Affected client routes/components:
  - `client/src/routes/*` (where debug panel is hosted)
  - `client/src/components/*` (new log console component(s))
  - `client/src/lib/*` (SSE subscription utilities/parsers)
- Affected server routes/services:
  - `server/src/routes/*` (new debug SSE endpoint)
  - `server/src/lib/events.ts` (debug event topics/types)
  - `server/src/services/*` and `server/src/stores/*` (debug event emission points)
- Affected shared contracts:
  - `shared/src/api/*` for typed debug SSE event schemas.
- Security/data handling:
  - Demo mode allows potentially sensitive payloads in debug stream by design.
