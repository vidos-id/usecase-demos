# MCP Wine Agent Demo

An AI-agent-driven wine shopping demo using the Model Context Protocol (MCP) and Vidos for age verification.

## Overview

This demo showcases how an AI agent can help users browse wines, manage a cart, and complete age-verified purchases using European Digital Identity (EUDI) Wallet credentials. The interaction is primarily text-based through chat, with a minimal QR code UI for the verification step.

The demo supports both MCP consumption and a regular HTTP API for OpenClaw-style agents.

## Features

- **Text-first product discovery**: Browse wines, view recommendations, and manage your cart through natural conversation
- **AI-guided checkout**: The agent walks you through the purchase process
- **Privacy-preserving age verification**: Uses Vidos to verify age via EUDI Wallet without exposing unnecessary personal data
- **Minimal UI**: Only the QR code verification step uses a custom widget; everything else stays in chat

## Architecture

MCP mode:

```
User <-> ChatGPT <-> MCP Server <-> Vidos Authorizer API <-> EUDI Wallet
```

HTTP API mode:

```
User <-> OpenClaw <-> Wine Store API <-> Vidos Authorizer API <-> EUDI Wallet
```

The MCP server exposes tools for:
- Wine catalog search (`search_wines`)
- Cart management (`add_to_cart`, `remove_from_cart`, `get_cart`)
- Checkout flow (`initiate_checkout`, `get_checkout_status`)

The HTTP API exposes endpoints for:
- Wine search (`POST /api/wines/search`)
- Cart management (`POST /api/cart/items`, `GET /api/cart/:cartSessionId`, `DELETE /api/cart/:cartSessionId/items/:wineId`)
- Checkout (`POST /api/checkout`, `GET /api/checkout/:checkoutSessionId`)

## Local Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0+)
- A Vidos account with Authorizer API access
- (Optional) EUDI Wallet app for testing verification

### Installation

```bash
# From repo root
bun install

# Navigate to this workspace
cd usecases/mcp-wine-agent
```

### Environment Variables

Create a `.env` file in this directory:

```env
VIDOS_AUTHORIZER_URL=https://authorizer.staging.vidos.id
VIDOS_API_KEY=your_api_key_here  # Optional, depending on your Vidos setup
PORT=30123
MCP_PATH=/mcp
```

### Running Locally

```bash
# Start the app
bun run dev

# Or
bun run start
```

The server runs as a Bun-hosted app exposing MCP and HTTP routes.

- MCP endpoint: `http://localhost:30123/mcp`
- API base: `http://localhost:30123/api`
- Health endpoint: `http://localhost:30123/health`

## Regular API Usage

This mode is intended for OpenClaw or any agent that prefers plain HTTP instead of MCP.

### Search wines

```bash
curl -X POST http://localhost:30123/api/wines/search \
  -H "Content-Type: application/json" \
  -d '{"type":"red","country":"Italy","maxPrice":80}'
```

### Add to cart

```bash
curl -X POST http://localhost:30123/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"wineId":"brunello-di-montalcino-riserva-2016","quantity":1}'
```

Reuse the returned `cartSessionId` exactly in later calls.

### Get cart

```bash
curl http://localhost:30123/api/cart/CART_SESSION_ID
```

### Remove from cart

```bash
curl -X DELETE http://localhost:30123/api/cart/CART_SESSION_ID/items/WINE_ID
```

### Initiate checkout

```bash
curl -X POST http://localhost:30123/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"cartSessionId":"CART_SESSION_ID"}'
```

For API clients, the server returns `authorizeUrl` but does not generate a QR code. The consuming agent should generate the QR code itself and also display the raw URL directly below it for phone users.

### Get checkout status

```bash
curl http://localhost:30123/api/checkout/CHECKOUT_SESSION_ID
```

Poll every few seconds for up to three minutes while waiting for verification to complete.

## ChatGPT Connector Usage

### Setting up in ChatGPT

1. Go to [ChatGPT](https://chat.openai.com) and create a new GPT
2. In the Configure tab, add an action with the MCP schema
3. Use the following configuration:

Use your deployed MCP endpoint URL, for example `https://your-domain.example/mcp`.

For local development with ChatGPT, expose the MCP endpoint with a public URL using a tunnel or deployment.

### Example Conversation Flow

**User**: "Show me some red wines from Italy"

**Agent**: *Uses `search_wines` tool to find matching wines and presents them in text*

**User**: "Add the Chianti to my cart"

**Agent**: *Uses `add_to_cart` tool and confirms the addition*

**User**: "I'm ready to checkout"

**Agent**: *Uses `initiate_checkout`, detects age-restricted items, informs user verification is needed*

**Agent**: *Uses `initiate_checkout`, creates the Vidos authorization automatically, and displays the QR widget*

**User**: *Scans QR with EUDI Wallet, completes verification*

**Agent**: *Polls `get_checkout_status`, confirms age verification success*

## Verification Flow

1. **Checkout Initiation**: When a cart contains wine, `initiate_checkout` detects the age-restricted product, creates the Vidos authorization immediately, and returns `verification_required` state with the authorization URL

2. **Authorization Request**: `initiate_checkout` sends a Vidos authorization request with a DCQL query requesting:
   - `given_name` (required)
   - `family_name` (required)
   - `birth_date` (required for age check)
   - `portrait` (optional)

3. **QR Presentation**: A minimal wine-themed widget displays the QR code for wallet scanning

4. **Background Monitoring**: The server polls Vidos for authorization status updates

5. **Age Evaluation**: Upon successful credential presentation, the server:
   - Extracts birth_date from the SD-JWT PID
   - Calculates age and compares against legal drinking age (18)
   - Updates checkout status to `verified` or `rejected`

6. **Agent Notification**: The next `get_checkout_status` call returns the result, which the agent narrates to the user

7. **Mock Payment Completion**: In HTTP API mode, once status becomes `verified`, the consuming agent should tell the user the wine was paid with a mock card and the order is confirmed

### Status Outcomes

| Status | Meaning | Agent Message |
|--------|---------|---------------|
| `pending` | No verification needed | "Ready to complete checkout" |
| `verification_required` | Awaiting user consent | "Age verification required" |
| `verifying` | QR shown, waiting for wallet | "Please scan the QR code..." |
| `verified` | Age confirmed | "✓ Verification successful! Age confirmed: 25 years old" |
| `rejected` | Underage or policy fail | "✗ Age verification failed: 16 years old (18 required)" |
| `expired` | Session timed out | "Session expired. Please restart." |
| `error` | Technical failure | "An error occurred. Please try again." |

## Development

### Type Checking

```bash
bun run check-types
```

### Linting

```bash
bun run lint
```

### Formatting

```bash
bun run format
```

## Project Structure

```
src/
├── api/
│   ├── router.ts              # HTTP API router
│   ├── responses.ts           # JSON response helpers
│   └── routes/
│       ├── cart.ts            # Cart HTTP endpoints
│       ├── checkout.ts        # Checkout HTTP endpoints
│       └── wines.ts           # Wine search HTTP endpoint
├── main.ts                    # Entry point
├── server.ts                  # MCP server creation and tool registration
├── schemas/
│   ├── catalog.ts            # Wine and cart types
│   └── verification.ts       # Checkout and verification types
├── services/
│   ├── shopping.ts           # Cart/wine logic
│   ├── wine-catalog.ts       # Wine data
│   ├── checkout.ts           # Checkout session management
│   ├── vidos-client.ts       # Vidos API client
│   └── authorization-monitor.ts  # Background polling
├── tools/
│   ├── shopping-tools.ts     # Wine/cart MCP tools
│   └── checkout-tools.ts     # Checkout/verification tools
└── ui/
    └── verification-widget.ts # QR code widget HTML generator
```

## Design Decisions

- **Text-first UX**: Product browsing stays in chat to maintain conversational flow
- **Minimal widget**: Only QR code display uses custom UI (better UX for wallet scanning)
- **Server-side state**: Cart and checkout state lives on the server for consistency
- **Streamable HTTP transport**: Correct primary transport for a publicly hosted ChatGPT MCP server
- **Polling-based updates**: Works reliably with ChatGPT's current tool calling model
- **Wine branding**: QR widget uses burgundy/gold colors matching the wine shop theme

## Troubleshooting

**MCP server not connecting**
- Ensure Bun is installed and on PATH
- Check that all dependencies are installed: `bun install`

**Vidos API errors**
- Verify `VIDOS_AUTHORIZER_URL` is set correctly
- Check that your Vidos API key is valid

**Age verification not working**
- Ensure your EUDI Wallet has a valid PID credential
- Check wallet is configured for the correct environment (staging/production)

## License

Internal use only - Vidos demo application.
