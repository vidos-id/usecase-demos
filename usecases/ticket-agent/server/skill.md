---
name: delegated-ticket-booking
description: Browse events and complete delegated ticket bookings using wallet-based credential receive and presentation flows. Use when asked to onboard a ticket agent, receive a delegation credential, list events, or book tickets through the ticket-agent demo.
license: Apache-2.0
compatibility: Requires Node/Bun and latest `openid4vc-wallet` CLI (installation instructions below)
metadata:
  author: vidos
  version: "2.0"
---

# Delegated Booking Skill

Use this skill to operate delegated ticket booking.

**Base URL:** `https://api-ticket-agent.demo.vidos.id`

If the user provides another API URL, use that instead.

This API uses credential delegation. The agent must first receive a delegation credential over OID4VCI, then present that credential over OID4VP to complete protected booking actions.

For all credential operations, use `openid4vc-wallet` only. Do not write custom scripts, custom protocol handlers, or manual credential-processing code.

## Ad-Hoc Use

This skill is meant to be read and followed ad hoc in the current session.

If the user provides this file by URL or raw `skill.md` content, read it and follow its instructions for the current task.

Do not claim or imply that the skill is installed locally.

## Before Agent Onboarding

Tell the user to complete their own setup in the relevant events web application first:

Web app: `https://eudi-usecase.demo.vidos.id/ticket-agent/`
Web app guide: `https://eudi-usecase.demo.vidos.id/ticket-agent/guide`

- sign up
- verify identity with PID
- create a delegation offer for the agent
- share the OID4VCI offer URL or offer link with the agent

After those steps, the agent is ready to receive the delegation credential.

## openid4vc-wallet

Install the CLI from `https://github.com/vidos-id/openid4vc-tools`.

Use the latest version of `@vidos-id/openid4vc-wallet-cli`.

`openid4vc-wallet` is the only approved way to receive, store, and present credentials for this skill.

```sh
npm install -g @vidos-id/openid4vc-wallet-cli
// OR
bun install -g @vidos-id/openid4vc-wallet-cli
openid4vc-wallet --help
```

Reference commands:

```bash
openid4vc-wallet init --wallet-dir ./wallet
openid4vc-wallet receive --wallet-dir ./wallet --offer "<openid-credential-offer://... or HTTPS offer URL>"
openid4vc-wallet present --wallet-dir ./wallet --request "<openid4vp://... authorization URL>"
```

## Flow

1. Use a stable wallet directory such as `./wallet`, initialize it once with `openid4vc-wallet init --wallet-dir ./wallet`, and reuse it across the full flow.
2. Wait for the user to share the delegation offer URL or `openid-credential-offer://` link, then receive the credential with `openid4vc-wallet receive --wallet-dir ./wallet --offer "<offer>"`.
3. Browse events with `GET /api/events` and event details with `GET /api/events/:id`.
4. Start a delegated booking with `POST /api/bookings` and body `{ "eventId": "evt-001", "quantity": 2 }`.
5. Read `authorizeUrl` and `statusToken` from the booking response.
6. Present the delegated credential with `openid4vc-wallet present --wallet-dir ./wallet --request "<authorizeUrl>"`.
7. After presentation, wait a few seconds, then poll `GET /api/bookings/status/<statusToken>` every 3 seconds for up to 180 seconds.
8. Report the final booking outcome clearly.

## Booking Status

- `confirmed`: booking succeeded
- `rejected`: verification failed, report `errorMessage`
- `expired`: verification session expired
- `error`: report `errorMessage`

## Rules

- Never ask the user for identity details that should come from the credential.
- Never skip verification or invent a successful booking.
- Never re-initialize an existing wallet unless the user explicitly asks for it.
- Use `openid4vc-wallet` exclusively for all credential operations.
- Do not build custom OID4VCI or OID4VP implementations.
- Do not create scripts, helpers, or ad hoc code to receive, parse, sign, store, import, export, or present credentials.
- Do not manually construct protocol messages, proofs, JWTs, or credential request payloads when `openid4vc-wallet` supports the flow.
- Use `openid4vc-wallet receive` for delegation credential intake and `openid4vc-wallet present` for booking authorization.
- Always use the returned `authorizeUrl` with `openid4vc-wallet present`.
- After presentation, wait briefly, then poll booking status and report the outcome.
- Show events in concise prose or bullets, not raw JSON or markdown tables.
- When proposing events, you may pair event details with the image URL `https://eudi-usecase.demo.vidos.id/ticket-agent/event-images/<event-id>`.
