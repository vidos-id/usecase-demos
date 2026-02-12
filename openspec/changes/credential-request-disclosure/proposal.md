## Why

Users currently initiate credential sharing via QR code, deep link, or DC API without knowing what specific credentials (PID claims) will be requested from their wallet. This lack of transparency reduces user trust and creates friction in the credential presentation flow. Users should be informed upfront about what data they will share before authenticating with their wallet.

## What Changes

- Add credential disclosure UI component that displays requested claims before wallet interaction
- Display the disclosure in all credential request flows: signup, signin, payment, and loan
- Show requested claims as human-readable labels (e.g., "Name", "Date of Birth", "Email")
- Include the purpose/purpose string from the authorization request
- Support all presentation modes: QR code, deep link, and DC API

## Capabilities

### New Capabilities

- `credential-request-disclosure`: A reusable component/utility that displays what credentials will be requested from the user's wallet. This includes mapping technical PID claim names to human-readable labels and showing the purpose of the request.

## Impact

- **Client**: New component in `client/src/components/auth/` to display credential disclosure. Updates to signup, signin, payment, and loan route pages to show requested claims before QR/deep-link display.
- **Server**: API responses for authorization requests already include `purpose`. The `requestedClaims` are defined server-side and may need to be included in the response for the client to display them.
- **Shared**: May need a utility to map PID claim names to human-readable labels.
