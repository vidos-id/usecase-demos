## Purpose

Wine shop product catalog with cart management, shipping destination selection, and order lifecycle.

## ADDED Requirements

### Requirement: Product catalog with age metadata

The system SHALL display a catalog of wine products on the landing page. Each product SHALL have: `id`, `name`, `type` (red/white/rosé/sparkling), `region`, `year`, `price`, `image` (path to asset in `public/wines/`), and `description`. Wine names and properties SHALL be derived from the provided image assets.

#### Scenario: Landing page displays product grid
- **WHEN** user navigates to the wine shop landing page
- **THEN** the system displays a grid of wine products with name, type, price, and image visible on each card

### Requirement: Cart management

The system SHALL allow users to add products to a cart, view cart contents, adjust quantities, and remove items. The cart SHALL persist in component state (lost on full page reload is acceptable for MVP). The cart SHALL display item subtotals and a cart total.

#### Scenario: Add product to cart
- **WHEN** user clicks "Add to Cart" on a product card or detail view
- **THEN** the product is added to the cart with quantity 1 (or quantity incremented if already in cart)

#### Scenario: View cart
- **WHEN** user navigates to the cart page
- **THEN** the system displays all cart items with name, quantity, unit price, subtotal, and cart total

#### Scenario: Remove item from cart
- **WHEN** user removes an item from the cart
- **THEN** the item is removed and the cart total is recalculated

#### Scenario: Empty cart blocks checkout
- **WHEN** user attempts to proceed to checkout with an empty cart
- **THEN** the system prevents navigation to checkout and displays a message indicating the cart is empty

### Requirement: Shipping destination selection

The system SHALL provide two pre-filled shipping destination options on the cart review page: an **EU address** (e.g., Berlin, Germany — legal drinking age 18) and a **US address** (e.g., New York, USA — legal drinking age 21). Each destination SHALL include: `id`, `label`, `country`, `region` ("EU" or "US"), `legalDrinkingAge`, and `address` (display string). The user MUST select a shipping destination before proceeding to checkout. The selected destination's `legalDrinkingAge` SHALL be used as the age threshold during verification.

#### Scenario: Two destinations displayed on cart page
- **WHEN** user views the cart page with items
- **THEN** the system displays two pre-filled shipping destination cards (EU and US) with address and legal drinking age visible

#### Scenario: Destination must be selected before checkout
- **WHEN** user attempts to proceed to checkout without selecting a shipping destination
- **THEN** the system prevents navigation and indicates a destination must be selected

#### Scenario: Selected destination determines age threshold
- **WHEN** user selects the US destination (legal drinking age 21)
- **THEN** the age check during verification SHALL use 21 as the required age

### Requirement: Order state lifecycle

The system SHALL maintain an order state with lifecycle: `draft → reviewed → awaiting_verification → verified → payment_confirmed → completed → failed`. The `orderId` SHALL be generated when the user proceeds from cart review to verification. The selected shipping destination SHALL be stored in the order state. State transitions SHALL be guarded — only valid transitions are allowed.

#### Scenario: Order created on checkout entry
- **WHEN** user proceeds from cart review to checkout/verification
- **THEN** an `orderId` is generated and order status transitions to `awaiting_verification`

#### Scenario: Invalid transition blocked
- **WHEN** a transition is attempted that is not in the allowed transition map
- **THEN** the transition is rejected and the order remains in its current state

#### Scenario: Order reset
- **WHEN** user triggers a demo reset
- **THEN** the order state and cart are cleared, returning to `draft` status
