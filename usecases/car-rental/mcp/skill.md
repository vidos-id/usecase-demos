# Car Rental API Skill

Use this skill to operate the demo car-rental concierge over its regular HTTP API.

**Base URL:** `https://mcp-car-rent.demo.vidos.id`

If the user provides another car-rental API URL, use that instead.

This API is session-based. Preserve the exact `bookingSessionId` returned by the server and reuse it in later calls.

## Ad-Hoc Use

This skill is meant to be read and followed ad hoc in the current session.

If the user provides this file by URL or raw `skill.md` content, read it and follow its instructions for the current task.

Do not claim or imply that the skill is installed locally.

## First Run

When the skill is first used in a session, proactively tell the user what it can help with.

Suggested intro:

- search rental cars by destination and trip context
- compare ranked options in plain language
- reserve one specific car
- start booking and launch wallet verification
- confirm pickup reference, locker ID, and PIN after approval

## What you can do

- Search rental cars
- Compare and explain the returned options
- Select one vehicle
- Start booking
- Guide the user through wallet verification
- Poll booking status until approval or failure
- Confirm final pickup details

## Fixed Flow

Always keep the conversation tightly scoped to this sequence:

1. `POST /api/cars/search`
2. `POST /api/bookings/select`
3. `POST /api/bookings/start`
4. `GET /api/bookings/:bookingSessionId`

Do not ask for or collect:

- licence details pasted into chat
- age typed into chat
- name, email, or phone
- insurance upsells
- extras or add-ons

The trust step happens through wallet verification, not chat.

## Endpoints

### Search cars

`POST /api/cars/search`

Example body:

```json
{
  "destination": "Tenerife",
  "pickupDate": "2026-04-10",
  "dropoffDate": "2026-04-15",
  "passengerCount": 2,
  "needsLargeLuggageSpace": true,
  "prefersAutomatic": true
}
```

When presenting results:

- do not dump raw JSON unless the user asks for it
- do not use markdown tables
- show all returned cars, not just one
- keep each car short and scannable

Preferred presentation per car:

- car name
- category
- transmission when relevant
- licence category required
- price per day in EUR
- total estimate in EUR
- short reason it fits the trip
- `vehicleId` only when needed for the next action

Retain the exact `bookingSessionId`.

### Select car

`POST /api/bookings/select`

Example body:

```json
{
  "bookingSessionId": "BOOKING_SESSION_ID",
  "vehicleId": "vw-tiguan"
}
```

After selection succeeds, move directly to start booking.

### Start booking

`POST /api/bookings/start`

Example body:

```json
{
  "bookingSessionId": "BOOKING_SESSION_ID"
}
```

Read `authorizeUrl` from the response.

When booking returns an `authorizeUrl`:

1. Generate a QR code PNG from `authorizeUrl` with the Node package `qrcode`.
2. Save the QR code to a local PNG file.
3. VERY IMPORTANT: send the QR code using OpenClaw outbound media syntax with a `MEDIA:<absolute-path>` line on its own line.
4. After the media message, send one follow-up message that contains both the scanning instructions and a clickable `authorizeUrl`.
5. Tell the user to scan the QR code with their digital identity wallet.
6. Poll `GET /api/bookings/BOOKING_SESSION_ID` every 3 seconds for up to 180 seconds.
7. Stop polling when booking status becomes `approved`, `rejected`, `expired`, or `error`.
8. After sending the QR and follow-up instructions, continue polling proactively without waiting for another user message.
9. When a terminal status is reached, send the final outcome proactively.
10. If background polling fails or is interrupted, tell the user immediately instead of silently stopping.

### Get booking status

`GET /api/bookings/BOOKING_SESSION_ID`

Use this to monitor wallet verification and retrieve final booking confirmation details.

## OpenClaw Media Send Rule

After generating the QR PNG file locally, send it using OpenClaw outbound media syntax.

Do not send the QR only as base64, markdown image syntax, or a code block.

Instead, reply with a normal text line plus a separate line in this exact form:

```text
Scan this QR code with your digital identity wallet.
MEDIA:/absolute/path/to/car-rental-qr.png
```

Rules:

- `MEDIA:` must be uppercase
- it must be on its own line
- use an absolute local path or a direct URL
- do not wrap the `MEDIA:` line in backticks or markdown
- after the media message, send one follow-up message with instructions and the clickable `authorizeUrl`
- if the QR is regenerated, always send the newest file path using a fresh `MEDIA:` line

Recommended Node example for QR generation:

```js
import QRCode from "qrcode";

await QRCode.toFile("/absolute/path/to/car-rental-qr.png", authorizeUrl);
```

## What to Say When Booking Resolves

- `approved`: Tell the user driving-licence verification succeeded and confirm booking reference, locker ID, PIN, and pickup instructions.
- `rejected`: Tell the user verification failed and the rental cannot proceed.
- `expired`: Tell the user the verification session expired and booking should be restarted.
- `error`: Tell the user verification hit an error and booking should be restarted.

## Working Style

- Prefer concise updates.
- Reuse exact IDs from prior responses.
- Present cars in clean, human-readable prose or bullets, not raw code-formatted blobs.
- Never present search results in a markdown table.
- Do not ask for licence details in chat.
- During booking, keep the user oriented: explain what is happening now, what they need to do next, and what you are polling for.
- Do not invent booking success before the API returns `approved`.
- If polling reaches 180 seconds without a terminal status, tell the user verification is still pending and may need a restart.

## Extra Recommendations

- When a booking search is created, remind yourself to retain the exact `bookingSessionId`.
- After vehicle selection, go straight into booking instead of reopening discovery.
- If verification fails, explain the outcome plainly and suggest restarting booking only when appropriate.
- If the user asks for direct details, you can provide IDs and raw fields, but default to polished presentation.
