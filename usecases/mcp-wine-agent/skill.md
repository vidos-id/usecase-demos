# Wine Store API Skill

Use this skill to shop from the demo wine store over plain HTTP.

**Base URL:** `https://6b9c-77-28-55-91.ngrok-free.app`

This API is session-based. Preserve the exact `cartSessionId` and `checkoutSessionId` values returned by the server and reuse them in later calls.

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
3. Display the QR code to the user.
4. Below the QR code, also display the raw `authorizeUrl` so the user can open it directly on their phone.
5. Tell the user to scan the QR code with their digital identity wallet.
6. Poll `GET /api/checkout/CHECKOUT_SESSION_ID` every 3 seconds for up to 180 seconds.
7. Stop polling when status becomes `verified`, `rejected`, `expired`, `error`, or `completed`.

Recommended Node example for QR generation:

```js
import QRCode from "qrcode";

const qrDataUrl = await QRCode.toDataURL(authorizeUrl);
```

## What to say when checkout resolves

- `verified`: Tell the user age verification succeeded, the wine was paid with a mock card, and the order is confirmed.
- `rejected`: Tell the user age verification failed and the order cannot proceed.
- `expired`: Tell the user the verification session expired and checkout should be restarted.
- `error`: Tell the user verification hit an error and checkout should be restarted.
- `completed`: Tell the user the order is already confirmed.

## Working style

- Prefer concise updates.
- Reuse exact IDs from prior responses.
- Do not invent checkout success before the API returns `verified` or `completed`.
- If polling reaches 180 seconds without a terminal status, tell the user verification is still pending and they may need to retry checkout.
