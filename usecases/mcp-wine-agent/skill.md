# Wine Store API Skill

Use this skill to shop from the demo wine store over plain HTTP.

**Base URL:** `https://6b9c-77-28-55-91.ngrok-free.app`

This API is session-based. Preserve the exact `cartSessionId` and `checkoutSessionId` values returned by the server and reuse them in later calls.

## Install In OpenClaw

```bash
mkdir -p ~/.openclaw/skills/wine-store
curl -L <the-skill.md-url> > ~/.openclaw/skills/wine-store/skill.md
```

Replace `<the-skill.md-url>` with what was provided to you.

After install, load or enable the skill in OpenClaw using your normal skill workflow.

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

Preferred presentation style:

- wine name and vintage
- type, region, country
- price in EUR
- a short plain-language summary
- optional food pairing or occasion hint
- the `wineId` only when needed for the next action

Show all wines returned by the search, not just a shortened subset.

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
2. Generate a QR code from `authorizeUrl` with the Node package `qrcode`.
3. VERY IMPORTANT: send the QR code as a separate image output, not as plain text and not embedded only as a code block.
4. After the QR image, send one single follow-up message that contains both the scanning instructions and a clickable `authorizeUrl` for users who prefer to click instead of scanning.
5. Tell the user to scan the QR code with their digital identity wallet.
6. Poll `GET /api/checkout/CHECKOUT_SESSION_ID` every 3 seconds for up to 180 seconds.
7. Stop polling when status becomes `verified`, `rejected`, `expired`, `error`, or `completed`.

Recommended Node example for QR generation:

```js
import QRCode from "qrcode";

const qrDataUrl = await QRCode.toDataURL(authorizeUrl);
```

If your runtime supports writing files or binary image attachments, prefer generating a PNG image and sending that image to the user. If not, use the best available image-capable output supported by OpenClaw.

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
- After adding wine to cart, be eager and motivating about checkout. Encourage the user to proceed to checkout if they seem ready.
- Do not mention age verification before checkout starts. Wait until the server returns an `authorizeUrl` or verification-required state.
- During checkout, keep the user oriented: explain what is happening now, what they need to do next, and what you are polling for.
- Do not invent checkout success before the API returns `verified` or `completed`.
- If polling reaches 180 seconds without a terminal status, tell the user verification is still pending and they may need to retry checkout.

## Extra Recommendations

- When a cart is created, remind yourself to retain the exact `cartSessionId`.
- When checkout starts, remind yourself to retain the exact `checkoutSessionId`.
- If verification fails, explain the outcome plainly and suggest restarting checkout only when appropriate.
- If the user asks for direct details, you can provide IDs and raw fields, but default to polished presentation.
