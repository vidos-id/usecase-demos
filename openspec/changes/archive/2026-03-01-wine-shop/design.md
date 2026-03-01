## Context

The project already has a car-rental demo at `usecases/car-rental/` that demonstrates mDL-based verification with a licence-category mismatch clause. We're adding a second use case — an online wine shop — that demonstrates **age-gated e-commerce** using PID for age verification. The architectural patterns (React Context stores, TanStack Router, Vidos Authorizer integration, DCQL queries, Zod schemas) are proven and will be reused structurally, but the wine-shop is a fully independent workspace with its own design, data, and domain logic.

**Constraints:**
- Frontend-only (no backend, no database).
- Live demo only — real wallet and real Vidos Authorizer API. No fallback/mock mode.
- Unique visual identity — wine/commerce theme, not a reskin of car-rental.
- Same authorizer REST API pattern: create → poll → policy-response → credentials.

---

## Goals / Non-Goals

**Goals:**
- Demonstrate age-gated commerce: underage buyer is blocked after credential verification.
- Show single-credential verification: PID (identity/age) via DCQL query.
- Provide a complete e-commerce-like flow: browse → cart → checkout → verify → pay → confirmation.
- Distinct, polished visual design that feels like a real wine shop.

**Non-Goals:**
- Product search/filtering complexity (small curated catalog is sufficient).
- Real payment processing or address validation.
- Inventory management or stock tracking.
- User accounts, login, or order history beyond current session.
- Backend or server component of any kind.
- Sharing code with car-rental (each usecase is self-contained).

---

## Decisions

### 1. Tech stack: same as car-rental

**Choice:** Vite + React 19 + TanStack Router + Tailwind v4 + shadcn/ui + Zod + openapi-fetch.

**Rationale:** Proven stack in the project. Keeps workspace setup consistent. No learning curve for contributors.

**Alternative considered:** Next.js or Astro — rejected because the project is frontend-only demos, and Vite is already the standard here.

### 2. Single PID credential in DCQL query

**Choice:** Request PID (SD-JWT VC, `dc+sd-jwt` format) in the authorization session.

**PID claims requested:**
- `given_name`, `family_name`, `birth_date` (required)
- `portrait` (optional)

**Rationale:** Keeps the demo focused on the age-gate clause. Single credential, single QR scan, minimal wallet interaction. The PID provides everything needed for age verification and credential highlights on confirmation.

**Alternative considered:** Adding Certificate of Residence for address auto-population — deferred to keep scope simple for MVP.

### 3. Country-based age threshold via shipping destination

**Choice:** The cart review page includes a "Ship to" section with two pre-filled destination addresses: an **EU address** (e.g., Berlin, Germany — legal drinking age 18) and a **US address** (e.g., New York, USA — legal drinking age 21). Selecting a destination determines the age threshold used during verification.

**Data model:**
```
ShippingDestination {
  id: string
  label: string           // "Berlin, Germany" / "New York, USA"
  country: string         // "DE" / "US"
  region: "EU" | "US"
  legalDrinkingAge: number // 18 / 21
  address: string         // Pre-filled display address
}
```

**Rationale:** This creates the most compelling demo moment — the same person with the same credential can be accepted (EU, age 19) or rejected (US, age 19) depending on shipping destination. No extra credentials needed, just a different business rule applied to the same verified data. Clean, visual, immediately understandable.

**Alternative considered:** Dropdown country selector — rejected because pre-filled address cards are more visual and faster to demo.

### 4. Age check as domain logic (not authorizer policy)

**Choice:** The frontend computes age from `birth_date` and compares against the selected shipping destination's `legalDrinkingAge`. This mirrors how car-rental computes licence-category match locally.

**Rationale:** The authorizer validates credential authenticity and runs its policy. The age-gate is a **business rule** the shop applies on top of verified claims — this is the correct separation and makes the clause more visible in the demo.

**Alternative considered:** Encoding age requirement in authorizer policy — rejected because it would hide the business logic from the demo UI and make the clause less demonstrable.

### 5. Simplified e-commerce flow with shipping step

**Choice:** Landing page with product grid → cart review (with shipping destination selection) → verification → payment → confirmation.

**Route structure:**
- `/` — Landing page with featured wines grid
- `/cart` — Cart review + shipping destination selection
- `/checkout` — Verification + age check
- `/payment` — Mock payment
- `/confirmation` — Order confirmation with credential highlights
- `/how-it-works` — Info page

**Rationale:** The shipping destination selector sits naturally in the cart review page. It must be selected before proceeding to checkout so the age threshold is known at verification time.

### 6. State management: Order Store + Verification Store

**Choice:** Two React Context stores, same pattern as car-rental.

**Order Store** (replaces Booking Store):
- `OrderState`: `{ status, orderId, items, shippingDestination, confirmation, updatedAt, lastError }`
- `OrderLifecycleStatus`: `draft → reviewed → awaiting_verification → verified → payment_confirmed → completed → failed`
- Transitions guarded by state machine.

**Verification Store:**
- Same lifecycle pattern: `created → pending_wallet → processing → success/rejected/expired/error`
- Adds `ageCheck` result (parallel to car-rental's `licenceCheck`).

### 7. Age check module

**Choice:** Dedicated `age-check.ts` module (mirrors `licence-check.ts`).

```
AgeCheckResult {
  eligible: boolean
  requiredAge: number        // from shipping destination's legalDrinkingAge
  actualAge: number | null
  birthDate: string | null
  destination: string        // shipping destination label for display
}
```

**Logic:** Compute age from `birth_date` claim. Compare against the selected shipping destination's `legalDrinkingAge`. If under threshold → `eligible: false`.

**Rejection UI:** When verification succeeds but age check fails, show `AgeRestrictionRejection` component with clear messaging (required age, actual age, guidance). Payment is blocked.

### 8. Visual design direction

**Choice:** Warm, sophisticated wine-commerce aesthetic. Dark/burgundy tones, serif headings for product names, clean card-based product grid, lifestyle imagery. Must feel distinctly different from car-rental's cool/modern automotive theme.

**Key visual elements:**
- Color palette: burgundy/wine-red primary, warm cream/off-white backgrounds, gold accents.
- Typography: serif for product names / headings, sans-serif for body.
- Product cards with wine bottle imagery.
- Elegant, minimal checkout flow.

### 9. Product data

**Choice:** Static array of 6–8 wine products with fields: `id`, `name`, `type` (red/white/rosé/sparkling), `region`, `year`, `price`, `image` (path to asset in `public/`), `description`. Wine names and properties will be derived from provided image assets. Age requirement is determined by shipping destination, not per-product.

### 10. Product images

**Choice:** Real wine bottle images provided as assets in `public/wines/`. The agent will inspect the images and derive wine name, type, region, year, and description from them when populating `data/wines.ts`.

---

## Risks / Trade-offs

**[Age calculation edge cases (birthdays, timezones)]** → Use simple date comparison (birth_date + required years ≤ today). Document that this is demo-grade, not production date math.

**[Small catalog limits replayability]** → Acceptable for demo. 6–8 products is enough variety. Can expand later.

---

## Open Questions

1. **PID format preference** — SD-JWT VC (`dc+sd-jwt`) or MSO Mdoc? SD-JWT is the primary format listed; mdoc PID is also available.
