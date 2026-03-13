# Wine Store API Skill

Use this skill to shop from the demo wine store over plain HTTP.

**Base URL:** `https://6b9c-77-28-55-91.ngrok-free.app`

This API is session-based. Preserve the exact `cartSessionId` and `checkoutSessionId` values returned by the server and reuse them in later calls.

## Installation behavior

If this skill was provided as a URL or raw `skill.md` content rather than loaded from a local installed skill directory, install it locally before using it, but only when the user explicitly asks for installation.

Installation target:
`~/.openclaw/skills/wine-store/skill.md`

Install by:

1. Creating the directory `~/.openclaw/skills/wine-store`
2. Fetching this exact skill file again from the provided source URL
3. Saving it as `~/.openclaw/skills/wine-store/skill.md`
4. Then continue using the skill normally

After installation, proactively tell the user:

- that the `wine-store` skill is now installed
- what it can help with
- that they can now ask for wine recommendations, cart management, or checkout

If the user only asks to read or follow this file, do not assume installation happened. In that case, you may use the instructions for the current task, but do not present the skill as installed unless the local file was actually created.

## Install In OpenClaw

```bash
mkdir -p ~/.openclaw/skills/wine-store
curl -L <the-skill.md-url> > ~/.openclaw/skills/wine-store/skill.md
```

Replace `<the-skill.md-url>` with what was provided to you.

After install, load or enable the skill in OpenClaw using your normal skill workflow.

Recommended user install prompt:

```text
Install the wine-store skill https://raw.githubusercontent.com/vidos-id/usecase-demos/refs/heads/main/usecases/mcp-wine-agent/skill.md
```

## First Run

When the skill is first installed or first used, proactively tell the user what it can help with.

Suggested intro:

- browse and compare wines by type, country, region, occasion, or price
- build and manage a wine cart
- start checkout for age-restricted wine purchases
- guide the user through wallet-based age verification
- confirm the order after verification, using a mock payment confirmation

## What you can do

- Search the wine catalog
- Create a cart and add wines to it
- Review or update the cart
- Start checkout
- Guide the user through Vidos age verification
- Confirm the order once verification succeeds

## Endpoints

### Search wines

`POST /api/wines/search`

When presenting search results, do not dump raw JSON or code blocks unless the user explicitly asks for raw data. Format wines in a human-friendly way with concise, readable descriptions.

Do not use markdown tables for wine results. Avoid table layouts entirely.

Preferred presentation style:

- wine name and vintage
- type, region, country
- price in EUR
- a short plain-language summary
- optional food pairing or occasion hint
- the `wineId` only when needed for the next action

Show all wines returned by the search, not just a shortened subset.

Preferred output shape:

- one wine per bullet
- short, plain sentences
- easy to scan in regular chat
- no fancy formatting beyond simple bullets

Example body:

```json
{
  "type": "red",
  "country": "Italy",
  "maxPrice": 80
}
```

### Add to cart

`POST /api/cart/items`

Example body for a new cart:

```json
{
  "wineId": "brunello-di-montalcino-riserva-2016",
  "quantity": 1
}
```

Example body for an existing cart:

```json
{
  "cartSessionId": "CART_SESSION_ID",
  "wineId": "brunello-di-montalcino-riserva-2016",
  "quantity": 1
}
```

### Get cart

`GET /api/cart/CART_SESSION_ID`

### Remove from cart

`DELETE /api/cart/CART_SESSION_ID/items/WINE_ID`

### Initiate checkout

`POST /api/checkout`

```json
{
  "cartSessionId": "CART_SESSION_ID"
}
```

### Get checkout status

`GET /api/checkout/CHECKOUT_SESSION_ID`

## Checkout behavior

When checkout returns `requiresVerification: true`:

1. Read `authorizeUrl` from the response.
2. Generate a QR code PNG from `authorizeUrl` with the Node package `qrcode`.
3. Save the QR code to a local PNG file.
4. VERY IMPORTANT: send the QR code using OpenClaw outbound media syntax with a `MEDIA:<absolute-path>` line on its own line.
5. Do not send the QR only as plain text, base64, markdown image syntax, or a code block.
6. After the media message, send one single follow-up message that contains both the scanning instructions and a clickable `authorizeUrl` for users who prefer to click instead of scanning.
7. Tell the user to scan the QR code with their digital identity wallet.
8. Poll `GET /api/checkout/CHECKOUT_SESSION_ID` every 3 seconds for up to 180 seconds.
9. Stop polling when status becomes `verified`, `rejected`, `expired`, `error`, or `completed`.
10. After sending the QR and follow-up instructions, continue polling proactively without waiting for another user message.
11. When a terminal status is reached, send the final outcome proactively.
12. If background polling fails or is interrupted, tell the user immediately instead of silently stopping.

## OpenClaw Media Send Rule

After generating the QR PNG file locally, send it using OpenClaw outbound media syntax.

Do not rely on reading the image file into the model as a way to send it.
Do not send the QR only as base64, markdown image syntax, or a code block.

Instead, reply with a normal text line plus a separate line in this exact form:

```text
Scan this QR code with your digital identity wallet.
MEDIA:/absolute/path/to/qr.png
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

await QRCode.toFile("/absolute/path/to/wine-checkout-qr.png", authorizeUrl);
```

Example OpenClaw send sequence:

```text
Your identity check is ready.
MEDIA:/root/.openclaw/workspace/tmp/wine-checkout-qr.png
```

Then in the next assistant message:

```text
Scan the QR code with your digital identity wallet, or open this link directly:
<authorizeUrl>
```

Preferred implementation pattern:

- use a background task or session that keeps polling after the QR is sent
- or use one long-running command that polls until a terminal status is reached, then sends the final result
- do not wait for the user to send another message before checking status again

## What to say when checkout resolves

- `verified`: Tell the user age verification succeeded, the wine was paid with a mock card, and the order is confirmed.
- `rejected`: Tell the user age verification failed and the order cannot proceed.
- `expired`: Tell the user the verification session expired and checkout should be restarted.
- `error`: Tell the user verification hit an error and checkout should be restarted.
- `completed`: Tell the user the order is already confirmed.

## Working style

- Prefer concise updates.
- Reuse exact IDs from prior responses.
- Present wines and cart contents in clean, human-readable prose or bullets, not raw code-formatted blobs.
- Never present wine search results in a markdown table.
- After adding wine to cart, be eager and motivating about checkout. Encourage the user to proceed to checkout if they seem ready.
- Do not mention age verification before checkout starts.
- Do not hint that checkout will involve age verification.
- Do not say phrases like "proceed with age verification", "next comes age verification", or similar before the server returns an `authorizeUrl` or verification-required state.
- Treat age verification as a dynamic surprise revealed only when the server requires it.
- During checkout, keep the user oriented: explain what is happening now, what they need to do next, and what you are polling for.
- Do not invent checkout success before the API returns `verified` or `completed`.
- If polling reaches 180 seconds without a terminal status, tell the user verification is still pending and they may need to retry checkout.

## Extra Recommendations

- When a cart is created, remind yourself to retain the exact `cartSessionId`.
- When checkout starts, remind yourself to retain the exact `checkoutSessionId`.
- If verification fails, explain the outcome plainly and suggest restarting checkout only when appropriate.
- If the user asks for direct details, you can provide IDs and raw fields, but default to polished presentation.
