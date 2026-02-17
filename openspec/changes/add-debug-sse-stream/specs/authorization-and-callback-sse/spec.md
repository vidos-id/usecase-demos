# Delta for Authorization and Callback SSE

## ADDED Requirements

### Requirement: Reusable SSE Transport Composition
The authorization and callback SSE capability SHALL expose reusable transport primitives that can be shared by additional SSE channels without coupling domain payloads.

#### Scenario: Shared envelope and serializer
- **WHEN** an SSE channel is implemented using the shared transport layer
- **THEN** channel uses common typed envelope and serializer utilities
- **THEN** domain-specific payload schemas remain separate from transport concerns

#### Scenario: Shared connection lifecycle utilities
- **WHEN** multiple SSE channels are active (for example authorization, callback, debug)
- **THEN** channels use shared connection lifecycle helpers for keepalive, cleanup, and disconnect handling
- **THEN** channels avoid duplicating lifecycle boilerplate

### Requirement: Channel-Level Isolation in Shared Router
The shared SSE routing layer SHALL isolate channel subscriptions and prevent cross-channel event leakage.

#### Scenario: Route debug and business events separately
- **WHEN** server emits business status events and debug events concurrently
- **THEN** business subscribers receive only business-channel events
- **THEN** debug subscribers receive only debug-channel events

#### Scenario: Channel contract mismatch
- **WHEN** a payload is emitted on a channel with an incompatible schema
- **THEN** shared layer rejects the emission path
- **THEN** invalid cross-channel payload delivery does not occur
