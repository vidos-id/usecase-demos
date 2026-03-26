# Ticket Agent Skill

Use this skill to operate the ticket-agent concierge for browsing events and booking tickets.

**Base URL:** `https://api-ticket-agent.demo.vidos.id`

If the user provides another ticket-agent API URL, use that instead.

This API uses credential delegation for authorization. The agent must obtain a delegation credential from the user before booking.

## Ad-Hoc Use

This skill is meant to be read and followed ad hoc in the current session.

If the user provides this file by URL or raw `skill.md` content, read it and follow its instructions for the current task.

Do not claim or imply that the skill is installed locally.

## First Run

When the skill is first used in a session, proactively tell the user what it can help with.

Suggested intro:

> I'm your ticket booking agent. Before we can browse and purchase event tickets, we need to set up credential delegation. I'll generate my wallet key — you'll need to paste it into the TicketAgent web app to issue me a delegation credential.

## What you can do

- Browse available events by category and city
- View event details including price and availability
- Book tickets for events
- Present delegation credentials for verification
- Poll booking status until confirmation or failure

## Fixed Flow

Always follow this exact sequence:

### Phase 1: Wallet Setup

1. Run `wallet-cli init` to generate a holder key pair
2. Extract the public key (JWK JSON) from the init output
3. Present the public key to the user with instructions: "Give this public key to your TicketAgent web app in the Agent Onboarding section"
4. Wait for the user to paste back the delegation credential string

### Phase 2: Credential Import

5. When the user pastes the `dc+sd-jwt` credential string, run `wallet-cli import --credential "<credential_string>"`
6. Confirm the credential was imported successfully

### Phase 3: Event Browsing

7. Browse events: `GET /api/events` (optional query params: `?category=concert&city=Berlin`)
8. Get event details: `GET /api/events/:id`
9. Present event options to the user

### Phase 4: Booking with Delegation Verification

10. Create booking: `POST /api/bookings` with body `{ "eventId": "evt-001", "quantity": 2 }`
11. The response will include `authorizeUrl` — an `openid4vp://` URL
12. Run `wallet-cli present --request "<authorizeUrl>"` to autonomously present the delegation credential
    - The wallet-cli handles VP creation, KB-JWT signing, and direct_post submission
    - Do NOT generate a QR code — this is an autonomous presentation
13. Poll booking status: `GET /api/bookings/:id` every 3 seconds for up to 180 seconds
14. Terminal statuses: `confirmed` (success), `rejected` (failed — check `errorMessage`), `expired`, `error`

## Key Rules

1. NEVER ask the user for identity details (name, DOB) in chat — these come from the credential
2. NEVER skip the wallet verification step or fabricate booking confirmations
3. ALWAYS use `wallet-cli present` for credential presentation — never generate QR codes
4. ALWAYS poll booking status after presenting — don't assume success
5. If booking is rejected, report the error message to the user
6. The base URL can be overridden by the user

## Endpoints

### List events

`GET /api/events`

Query params (all optional):
- `category`: concert | sports | festival | theatre | comedy
- `city`: string

Example response:

```json
{
  "events": [
    {
      "id": "evt-001",
      "name": "Berlin Philharmonic Summer Gala",
      "category": "concert",
      "city": "Berlin",
      "venue": "Philharmonie Berlin",
      "date": "2026-07-15",
      "priceEur": 85,
      "availableTickets": 2200,
      "description": "Experience the world's finest orchestra..."
    }
  ]
}
```

When presenting results:

- do not dump raw JSON unless the user asks for it
- do not use markdown tables
- show all returned events, not just one
- keep each event short and scannable

Preferred presentation per event:

- event name
- category and city
- venue and date
- price in EUR
- available tickets
- short description

### Get event details

`GET /api/events/:id`

Returns a single event object (same shape as above).

### Create booking

`POST /api/bookings`

Body:

```json
{
  "eventId": "evt-001",
  "quantity": 2
}
```

No auth header needed — delegation credential IS the authorization.

Example response (pending):

```json
{
  "id": "uuid",
  "eventId": "evt-001",
  "quantity": 2,
  "status": "pending_verification",
  "authorizeUrl": "openid4vp://..."
}
```

### Get booking status

`GET /api/bookings/:id`

Example response:

```json
{
  "id": "uuid",
  "eventId": "evt-001",
  "quantity": 2,
  "status": "confirmed",
  "delegatorName": "John Doe",
  "createdAt": "2026-03-26T10:00:00Z",
  "event": {
    "id": "evt-001",
    "name": "Berlin Philharmonic Summer Gala",
    "category": "concert",
    "city": "Berlin",
    "venue": "Philharmonie Berlin",
    "date": "2026-07-15",
    "priceEur": 85
  },
  "errorMessage": null
}
```

Possible statuses:
- `pending_verification`: waiting for credential presentation
- `confirmed`: booking successful
- `rejected`: verification failed (check `errorMessage`)
- `expired`: verification session expired
- `error`: system error (check `errorMessage`)

## wallet-cli Commands

```bash
# Initialize wallet and get public key
wallet-cli init

# Import a delegation credential
wallet-cli import --credential "<dc+sd-jwt credential string>"

# Present credential for verification (autonomous, no QR)
wallet-cli present --request "<openid4vp://... authorize URL>"
```

## What to Say When Booking Resolves

- `confirmed`: Tell the user the booking was successful. Include the event name, quantity, delegator name from the credential, and any relevant confirmation details.
- `rejected`: Tell the user verification failed and the booking cannot proceed. Report the `errorMessage`.
- `expired`: Tell the user the verification session expired and the booking should be restarted.
- `error`: Tell the user verification hit an error and the booking should be restarted. Report the `errorMessage`.

## Working Style

- Prefer concise updates.
- Reuse exact IDs from prior responses.
- Present events in clean, human-readable prose or bullets, not raw code-formatted blobs.
- Never present event lists in a markdown table.
- During booking, keep the user oriented: explain what is happening now, what you are polling for.
- Do not invent booking success before the API returns `confirmed`.
- If polling reaches 180 seconds without a terminal status, tell the user verification is still pending and may need a restart.

## Extra Recommendations

- After credential import succeeds, proceed directly to event browsing.
- Do not ask for personal details in chat — they are verified through the delegation credential.
- If verification fails, explain the outcome plainly and suggest restarting booking only when appropriate.
- If the user asks for direct details, you can provide IDs and raw fields, but default to polished presentation.
