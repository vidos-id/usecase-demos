## Why

DemoBank needs foundational server infrastructure to support PID-based authentication and authorization flows via Vidos Authorizer integration. Without core data models, environment configuration, and a service layer for communicating with Vidos, we cannot implement any user-facing authentication features.

## What Changes

- Add in-memory data structures for users, sessions, and pending authorization requests
- Define environment variables for Vidos Authorizer configuration (base URL and API key)
- Implement Vidos service layer for creating authorization requests and handling results
- Support both direct_post (QR/deep link) and dc_api (browser API) presentation modes
- Handle both SD-JWT VC and ISO/IEC 18013-5 mdoc credential formats

## Capabilities

### New Capabilities

- `data-models`: Server-side TypeScript interfaces and in-memory stores for User, Session, and PendingAuthRequest entities
- `environment-config`: Environment variable definitions and validation for Vidos Authorizer integration (VIDOS_AUTHORIZER_URL, VIDOS_API_KEY)
- `vidos-service`: Service layer for interacting with Vidos Authorizer API (create authorization requests, poll status, forward results)

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

**Server:**
- New types and interfaces in `server/src/` for core data models
- New environment variables must be configured before server starts
- New service module for Vidos API integration

**Shared:**
- May need shared types for request/response payloads (to be determined in design phase)

**Dependencies:**
- Vidos Authorizer availability and API key required for runtime functionality
- No new npm dependencies anticipated (using native fetch)

**Unlocks:**
- This change is a prerequisite for `auth-flows` which will implement signup/signin endpoints
- This change is also required for `payment-flow` and `loan-flow` endpoints
- Provides foundation for all PID-based identification features
