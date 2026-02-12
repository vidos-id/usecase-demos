## Context

The application has four credential presentation flows (signup, signin, payment, loan) where users share PID credentials via QR code, deep link, or DC API. Currently, users see only a QR code or deep link prompt without knowing what specific credentials will be requested from their wallet. This reduces transparency and trust.

**Current state:**
- Server defines requested claims per flow in route files (`SIGNUP_CLAIMS`, `SIGNIN_CLAIMS`, etc.)
- Purpose strings are passed to Vidos but not returned to client
- Client displays QR code / DC API handler without showing requested data

**Constraints:**
- Must work with all three presentation modes: `direct_post` (QR), `dc_api`, and deep link
- Claims are defined by PID SD-JWT schema (EUDI Wallet standard)
- Must maintain existing API contract where possible

## Goals / Non-Goals

**Goals:**
- Display human-readable credential disclosure before wallet interaction
- Show the purpose of the credential request
- Map technical PID claim names to user-friendly labels
- Consistent UX across all four flows (signup, signin, payment, loan)

**Non-Goals:**
- Changing the Vidos/authorizer API (only our app's API)
- Modifying credential request logic (claims remain server-defined)
- Adding user consent UI (just disclosure/preview)

## Decisions

### 1. Centralize claims definitions in shared package

**Decision:** Move `SIGNUP_CLAIMS`, `SIGNIN_CLAIMS`, `PAYMENT_CLAIMS`, and `LOAN_CLAIMS` from server route files to shared package.

**Rationale:**
- Single source of truth for what claims each flow requests
- Enables client to import and display requested claims without duplicating definitions
- Follows the existing pattern where `shared/types/auth.ts` already defines claim schemas

**Alternative considered:** Keep claims in server, add new API endpoint to fetch requested claims. Rejected - adds latency and complexity.

### 2. Include requested claims in API response

**Decision:** Extend the signup/signin/payment/loan request response schemas to include `requestedClaims` and `purpose` fields.

**Implementation:**
```ts
// In shared/api/signup.ts (similar for other flows)
signupRequestResponseBaseSchema.extend({
  requestedClaims: z.array(z.string()), // e.g., ["family_name", "given_name", ...]
  purpose: z.string(), // e.g., "Verify your identity for signup"
})
```

**Rationale:** Client needs this data to render the disclosure. Could alternatively hardcode per-flow in client, but that duplicates logic and makes maintenance harder.

### 3. Create shared claim label utility

**Decision:** Add a utility in `shared/src/lib/claims.ts` that maps PID claim names to human-readable labels.

**Mapping:**
| Claim Name | Human-Readable Label |
|------------|----------------------|
| `family_name` | Family Name |
| `given_name` | Given Name |
| `birthdate` | Date of Birth |
| `email` | Email Address |
| `nationalities` | Nationalities |
| `place_of_birth` | Place of Birth |
| `personal_administrative_number` | Personal ID Number |
| `document_number` | Document Number |
| `picture` | Profile Picture |

### 4. Create disclosure component in client

**Decision:** Create `CredentialDisclosure` component in `client/src/components/auth/` that:
- Accepts `requestedClaims: string[]` and `purpose: string` props
- Uses shared label utility to display human-readable names
- Renders before QR code / DC API handler in the flow
- Styled consistently with existing auth components

## Risks / Trade-offs

- **[Risk]** Adding fields to API response could break existing clients. → **Mitigation:** New fields are optional; existing clients ignore them. Backward compatible.

- **[Risk]** Claims list could be large. → **Mitigation:** PID has limited claims (~9). Display in compact list format.

- **[Risk]** Deep link mode (same as QR, uses `direct_post`). → **Mitigation:** Component works for both since they share the same response type.

## Migration Plan

1. **Add shared claims definitions** - Create `shared/src/lib/claims.ts` with claim constants and label mapping
2. **Update server routes** - Import claims from shared, add to API responses
3. **Update shared API schemas** - Add `requestedClaims` and `purpose` to response schemas
4. **Create client component** - Build `CredentialDisclosure` component
5. **Integrate into routes** - Add component to signup, signin, payment, loan pages
6. **Type check & lint** - Run `bun run check-types` and `bun run lint`

**Rollback:** Revert API response changes and remove component. Claims definitions in shared are new, so no breaking changes.
