# Delegated Booking Skill

Use this skill for delegated ticket booking.

**Base URL:** `https://api-ticket-agent.demo.vidos.id`

If the user provides another API URL, use that instead.

This API uses credential delegation. The agent must receive a delegation credential directly from the issuer over OID4VCI before completing protected actions.

## Ad-Hoc Use

If the user shares this file by URL or raw `skill.md` content, follow it for the current session only. Do not claim the skill is installed locally.

## Before Agent Onboarding

Tell the user to complete their own setup in the relevant events web application first:

Web app: `https://eudi-usecase.demo.vidos.id/ticket-agent/`

- sign up
- verify identity with PID
- create a delegation offer for the agent
- share the OID4VCI offer URL or offer link with the agent

After those steps, the agent is onboarded.

## wallet-cli

`wallet-cli` must be installed from `https://github.com/vidos-id/oid4vp-cli-utils`.

Use `wallet-cli` `0.4.0` or newer.

The currently available `wallet-cli receive` flow is not aligned with the OID4VCI 1.0 request shape required by this demo. Until the wallet tooling is updated, redeem the offer manually using the spec-compliant flow below.

Reference commands:

```bash
wallet-cli init --wallet-dir ./wallet
wallet-cli present --wallet-dir ./wallet --request "<openid4vp://... authorization URL>"
```

## Flow

1. Use a stable wallet directory such as `./wallet`.
2. Initialize only once with `wallet-cli init --wallet-dir ./wallet`.
3. If the wallet is already initialized, skip init and reuse it.
4. Re-initializing the wallet replaces the wallet key and destroys access to previously received credentials. Do not re-initialize unless the user explicitly requests it.
5. Wait for the user to share the OID4VCI offer URL or `openid-credential-offer://` link.
6. Resolve the offer. If the user shares an `openid-credential-offer://` link, extract either the inline `credential_offer` or fetch the `credential_offer_uri` over HTTPS.
7. Read the `credential_issuer`, `credential_configuration_ids[0]`, and pre-authorized code from the offer.
8. Fetch issuer metadata from `/.well-known/openid-credential-issuer` under the issuer base URL.
9. Exchange the pre-authorized code at the metadata `token_endpoint` using form-encoded body `grant_type=urn:ietf:params:oauth:grant-type:pre-authorized_code` and the `pre-authorized_code`.
10. Fetch a fresh nonce from the metadata `nonce_endpoint`.
11. Read the wallet public JWK from `./wallet/holder-key.json` and create a compact JWT proof with:
12. JOSE protected header: `{"alg":"ES256","typ":"openid4vci-proof+jwt","jwk":<public JWK>}` unless the wallet uses a different initialized algorithm.
13. JWT payload: `{"iss":"wallet-cli","aud":"<credential_issuer>","iat":<now>,"nonce":"<c_nonce>"}`.
14. Sign the proof with the wallet private key from the initialized wallet.
15. Call the metadata `credential_endpoint` with `Authorization: Bearer <access_token>` and JSON body:
16. `{"credential_configuration_id":"<id>","proofs":{"jwt":[{"proof_type":"jwt","jwt":"<compact proof jwt>"}]}}`
17. Store the returned compact credential and import it into the wallet only if your local wallet tooling requires a manual storage step.
18. Browse events with `GET /api/events` and event details with `GET /api/events/:id`.
19. Start a delegated booking with `POST /api/bookings` and body `{ "eventId": "evt-001", "quantity": 2 }` without app session auth.
20. Read `authorizeUrl` and `statusToken` from the booking response.
21. Present the credential with `wallet-cli present --wallet-dir ./wallet --request "<authorizeUrl>"`.
22. After presentation, wait a few seconds for authorization and booking processing.
23. Then poll `GET /api/bookings/status/<statusToken>` every 3 seconds for up to 180 seconds and report the result.

## Booking Status

- `confirmed`: booking succeeded
- `rejected`: verification failed, report `errorMessage`
- `expired`: verification session expired
- `error`: report `errorMessage`

## Rules

- Never ask the user for identity details that should come from the credential.
- Never skip verification or invent a successful booking.
- Never re-initialize an existing wallet unless the user explicitly asks for it.
- Use an OID4VCI 1.0 compliant credential request with the `proofs` parameter. Do not use legacy `proof` request payloads.
- Do not rely on `wallet-cli receive` until it generates a spec-compliant `proofs` request for this flow.
- Always use the returned `authorizeUrl` with `wallet-cli present`.
- After presentation, wait briefly, then poll booking status and report the outcome.
- Show events in concise prose or bullets, not raw JSON or markdown tables.
- When proposing events, you may pair event details with the image URL `https://eudi-usecase.demo.vidos.id/ticket-agent/event-images/<event-id>`.
