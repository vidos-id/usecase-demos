# Delegated Booking Skill

Use this skill for delegated ticket booking.

**Base URL:** `https://api-ticket-agent.demo.vidos.id`

If the user provides another API URL, use that instead.

This API uses credential delegation. The agent must obtain a delegation credential from the user before completing protected actions.

## Ad-Hoc Use

If the user shares this file by URL or raw `skill.md` content, follow it for the current session only. Do not claim the skill is installed locally.

## Before Agent Onboarding

Tell the user to complete their own setup in the relevant events web application first:

Web app: `https://eudi-usecase.demo.vidos.id/ticket-agent/`

- sign up
- verify identity with PID
- onboard the agent by sharing the agent's public JWK
- forward the issued delegation credential to the agent

After those steps, the agent is onboarded.

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
4. Re-initializing the wallet replaces the wallet key and destroys access to previously imported credentials. Do not re-initialize unless the user explicitly requests it.
5. Read the public key from `./wallet/holder-key.json` and share it with the user as JSON JWK.
6. Tell the user to paste that public JWK into the web app during agent onboarding so it can issue a delegation credential.
7. Wait for the user to paste the `dc+sd-jwt` credential string.
8. Import it with `wallet-cli import --wallet-dir ./wallet --credential "<credential_string>"`.
9. Browse events with `GET /api/events` and event details with `GET /api/events/:id`.
10. Start a delegated booking with `POST /api/bookings` and body `{ "eventId": "evt-001", "quantity": 2 }` without app session auth.
11. Read `authorizeUrl` and `statusToken` from the booking response.
12. Present the credential with `wallet-cli present --wallet-dir ./wallet --request "<authorizeUrl>"`.
13. After presenting, wait a few seconds for authorization and booking processing.
14. Then poll `GET /api/bookings/status/<statusToken>` every 3 seconds for up to 180 seconds and report the result.

## Booking Status

- `confirmed`: booking succeeded
- `rejected`: verification failed, report `errorMessage`
- `expired`: verification session expired
- `error`: report `errorMessage`

## Rules

- Never ask the user for identity details that should come from the credential.
- Never skip verification or invent a successful booking.
- Never re-initialize an existing wallet unless the user explicitly asks for it.
- Always use the returned `authorizeUrl` with `wallet-cli present`.
- After presentation, wait briefly, then poll booking status and report the outcome.
- Show events in concise prose or bullets, not raw JSON or markdown tables.
- When proposing events, you may pair event details with the image URL `https://eudi-usecase.demo.vidos.id/ticket-agent/event-images/<event-id>`.
