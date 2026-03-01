## 1. Project Setup

- [x] 1.1 Scaffold `usecases/wine-shop/` workspace (Vite + React 19 + TypeScript + TanStack Router + Tailwind v4 + shadcn/ui). Configure `vite.config.ts` with `base: "/wine-shop/"`, path alias `@/`, TanStack Router plugin.
- [x] 1.2 Add shadcn/ui base components (button, card, badge, separator, input) and configure `components.json`.
- [x] 1.3 Set up `index.css` with Tailwind v4 imports and wine-shop theme tokens (burgundy/wine-red primary, cream backgrounds, gold accents, serif + sans-serif typography).
- [x] 1.4 Create OpenAPI-generated authorizer types (`generated/authorizer-api.ts`) — copy from car-rental or regenerate from schema.

## 2. Product Catalog & Data

- [x] 2.1 Inspect provided wine image assets in `public/wines/`, derive wine names, types, regions, years, prices, and descriptions from the images. Create `data/wines.ts` with the product array.
- [x] 2.2 Create product type definitions (`domain/catalog/catalog-types.ts`): `WineProduct`, `CartItem`, `Cart`.
- [x] 2.3 Create shipping destination data (`data/shipping-destinations.ts`): two pre-filled destinations — EU (Berlin, Germany, legalDrinkingAge: 18) and US (New York, USA, legalDrinkingAge: 21). Type: `ShippingDestination { id, label, country, region, legalDrinkingAge, address }`.

## 3. Routing & Layout

- [x] 3.1 Create root route (`routes/__root.tsx`) with app shell layout (header with shop name, cart icon with item count, navigation).
- [x] 3.2 Create landing page route (`routes/index.tsx`) with product grid displaying wine cards.
- [x] 3.3 Create cart route (`routes/cart.tsx`) with cart items list, quantities, subtotals, total, shipping destination selector (two pre-filled address cards), and "Proceed to Checkout" button. Checkout blocked if no destination selected.
- [x] 3.4 Create checkout/verify route (`routes/checkout.tsx`) with verification flow (QR code, status indicators, age check result using selected destination's legal drinking age).
- [x] 3.5 Create payment route (`routes/payment.tsx`) with mock pre-filled payment card and "Confirm Order" button.
- [x] 3.6 Create confirmation route (`routes/confirmation.tsx`) with order reference, summary, shipping destination, and credential highlights section.
- [x] 3.7 Create how-it-works route (`routes/how-it-works.tsx`) with info about the demo flow.

## 4. State Management

- [x] 4.1 Create order types (`domain/order/order-types.ts`): `OrderState` (including `shippingDestination`), `OrderLifecycleStatus` (draft → reviewed → awaiting_verification → verified → payment_confirmed → completed → failed).
- [x] 4.2 Create order state machine (`domain/order/order-machine.ts`): transition guards, allowed transitions map.
- [x] 4.3 Create order store (`domain/order/order-store.tsx`): React Context provider with cart operations (add, remove, update quantity), shipping destination selection, and order lifecycle transitions.
- [x] 4.4 Create verification types and schemas (`domain/verification/verification-schemas.ts`, `verification-types.ts`).
- [x] 4.5 Create verification state machine (`domain/verification/verification-machine.ts`): lifecycle states, transitions, recovery logic.
- [x] 4.6 Create verification store (`domain/verification/verification-store.tsx`): React Context provider with start/poll/retry/reset actions.

## 5. Authorizer Integration

- [x] 5.1 Create authorizer client (`domain/verification/authorizer-client.ts`): API functions for create authorization, get status, get policy response, get credentials. Use `openapi-fetch` with generated types. Env var: `VITE_VIDOS_WINE_SHOP_AUTHORIZER_URL`, `VITE_VIDOS_API_KEY`.
- [x] 5.2 Create verification request builder (`domain/verification/verification-request.ts`): build DCQL query with PID credential (`dc+sd-jwt` format), claims: given_name, family_name, birth_date (required), portrait (optional). Generate cryptographic nonce.
- [x] 5.3 Create verification response mappers (`domain/verification/verification-mappers.ts`): normalize raw authorizer response to domain model (`NormalizedPidClaims`: givenName, familyName, birthDate, portrait).

## 6. Age Check Logic

- [x] 6.1 Create age check module (`domain/verification/age-check.ts`): `checkAgeEligibility(disclosedClaims, requiredAge, destinationLabel) → AgeCheckResult { eligible, requiredAge, actualAge, birthDate, destination }`. Compute age from birth_date, compare against the selected shipping destination's `legalDrinkingAge`.

## 7. UI Components

- [x] 7.1 Create product card component (`components/catalog/wine-card.tsx`): product image, name, type badge, region, year, price, "Add to Cart" button.
- [x] 7.2 Create cart item row component (`components/cart/cart-item-row.tsx`): product info, quantity controls, subtotal, remove button.
- [x] 7.3 Create shipping destination card component (`components/cart/shipping-destination-card.tsx`): address display, legal drinking age label, selectable state.
- [x] 7.4 Create verification QR panel component (`components/verification/verification-qr-panel.tsx`): QR code display, status text, loading states.
- [x] 7.5 Create verification status indicators (`components/verification/verification-status.tsx`): step indicators for the verification lifecycle.
- [x] 7.6 Create age restriction rejection component (`components/verification/age-restriction-rejection.tsx`): required age (from destination), actual age, destination name, guidance text, styled as a warning/error panel.
- [x] 7.7 Create verification blocked panel (`components/verification/verification-blocked-panel.tsx`): failure reason, retry/reset actions.
- [x] 7.8 Create payment card display component (`components/payment/payment-card-display.tsx`): pre-filled non-editable card, simulated payment label.
- [x] 7.9 Create order summary component (`components/payment/order-summary.tsx`): items, quantities, totals, shipping destination.
- [x] 7.10 Create credential highlights component (`components/confirmation/credential-highlights.tsx`): name, age verification badge, portrait (if available).
- [x] 7.11 Create demo reset hook (`domain/reset/use-demo-reset.ts`): clears order + verification state, navigates to landing page.

## 8. Visual Design & Polish

- [x] 8.1 Style landing page with wine-shop aesthetic: warm burgundy tones, serif headings for wine names, elegant product grid layout.
- [x] 8.2 Style cart page: cart items + shipping destination cards with clear visual distinction between EU and US options, legal drinking age prominently displayed.
- [x] 8.3 Style checkout and verification pages consistently with the wine-shop theme.
- [x] 8.4 Style confirmation page with credential highlights section as a visual "wow" moment.
- [x] 8.5 Ensure responsive layout works on desktop and mobile.

## 9. Integration & Wiring

- [x] 9.1 Wire landing page: product grid renders from `data/wines.ts`, "Add to Cart" dispatches to order store.
- [x] 9.2 Wire cart page: renders from order store, shipping destination cards selectable, "Proceed to Checkout" requires destination selected + non-empty cart, transitions order and navigates to checkout.
- [x] 9.3 Wire checkout page: triggers authorizer session, displays QR, polls status, runs age check on success using `shippingDestination.legalDrinkingAge`, shows rejection or enables payment navigation.
- [x] 9.4 Wire payment page: guards against unverified orders, "Confirm Order" transitions order and navigates to confirmation.
- [x] 9.5 Wire confirmation page: renders order summary + shipping destination + credential highlights from stores.
- [x] 9.6 Wire demo reset: accessible from header or each page, clears all state.

## 10. Home Navigator Entry

- [x] 10.1 Add wine shop entry to `usecases-home/` navigation with link, description, and icon/thumbnail.
