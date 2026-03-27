# Delegated Booking Skill

Use this skill for delegated event browsing and booking.

**Base URL:** `https://api-ticket-agent.demo.vidos.id`

If the user provides another API URL, use that instead.

This API uses credential delegation. The agent must obtain a delegation credential from the user before completing protected actions.

## Ad-Hoc Use

If the user shares this file by URL or raw `skill.md` content, follow it for the current session only. Do not claim the skill is installed locally.

## Before Agent Onboarding

Tell the user to complete their own setup in the relevant events web application first:

Web app: `https://eudi-usecase.demo.vidos.id/ticket-agent/`

- register an account
- complete any required verification
- confirm they can use the app themselves
- only then onboard the agent and issue a delegation credential

## wallet-cli

`wallet-cli` must be installed from `https://github.com/vidos-id/oid4vp-cli-utils`.

Reference commands:

```bash
wallet-cli init --wallet-dir ./wallet
wallet-cli import --wallet-dir ./wallet --credential "<dc+sd-jwt credential string>"
wallet-cli present --wallet-dir ./wallet --request "<openid4vp://... authorization URL>"
```

## Flow

1. Use a stable wallet directory such as `./wallet`.
2. Initialize only once with `wallet-cli init --wallet-dir ./wallet`.
3. If the wallet is already initialized, skip init and reuse it.
4. Read the public key from `./wallet/holder-key.json` and share only the public JWK fields with the user.
5. Tell the user to register that public key in the relevant web app so it can issue a delegation credential.
6. Wait for the user to paste the `dc+sd-jwt` credential string.
7. Import it with `wallet-cli import --wallet-dir ./wallet --credential "<credential_string>"`.
8. Browse events with `GET /api/events` and event details with `GET /api/events/:id`.
9. Create a booking with `POST /api/bookings` and body `{ "eventId": "evt-001", "quantity": 2 }`.
10. Read `authorizeUrl` from the booking response.
11. Present the credential with `wallet-cli present --wallet-dir ./wallet --request "<authorizeUrl>"`.
12. Poll `GET /api/bookings/:id` every 3 seconds for up to 180 seconds.

## Booking Status

- `confirmed`: booking succeeded
- `rejected`: verification failed, report `errorMessage`
- `expired`: verification session expired
- `error`: report `errorMessage`

## Rules

- Never ask the user for identity details that should come from the credential.
- Never skip verification or invent a successful booking.
- Always use the returned `authorizeUrl` with `wallet-cli present`.
- Always poll booking status after presentation.
- Show events in concise prose or bullets, not raw JSON or markdown tables.
- When proposing events, you may pair event details with the image URL `https://eudi-usecase.demo.vidos.id/ticket-agent/event-images/<event-id>`.
