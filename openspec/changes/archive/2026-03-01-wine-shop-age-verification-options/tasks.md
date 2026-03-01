## 1. Types and Domain Model

- [x] 1.1 Add `AgeVerificationMethod` type to `verification-types.ts` (`"age_equal_or_over" | "age_in_years" | "birthdate"`)
- [x] 1.2 Add `ageVerificationMethod: AgeVerificationMethod | null` field to `OrderState` in `order-types.ts`

## 2. Order Machine and Store

- [x] 2.1 Add `SET_AGE_VERIFICATION_METHOD` transition (or equivalent action) to `order-machine.ts` that sets `ageVerificationMethod` on state
- [x] 2.2 Expose `setAgeVerificationMethod(method: AgeVerificationMethod)` from `order-store.tsx`
- [x] 2.3 Guard `proceedToCheckout` — return `{ ok: false }` if `ageVerificationMethod` is `null`

## 3. DCQL Query Builder

- [x] 3.1 Update `buildCreateAuthorizationBody` signature in `authorizer-client.ts` to accept `ageVerificationMethod: AgeVerificationMethod`
- [x] 3.2 Implement claim-path selection switch: `age_equal_or_over` → `["age_equal_or_over", "<age>"]`, `age_in_years` → `["age_in_years"]`, `birthdate` → `["birthdate"]`

## 4. Verification Store Wiring

- [x] 4.1 Update `startVerification` input type to include `ageVerificationMethod: AgeVerificationMethod`
- [x] 4.2 Forward `ageVerificationMethod` from `startVerification` into `createAuthorizerAuthorization`
- [x] 4.3 Update `retryVerification` to also accept and forward `ageVerificationMethod`

## 5. Cart UI — Age Method Selector

- [x] 5.1 Create `AgeMethodSelector` component in `src/components/` with three selectable option cards (label + subtitle per spec)
- [x] 5.2 Integrate `AgeMethodSelector` into `CartPage` below the shipping destination section, wired to `setAgeVerificationMethod` from order store
- [x] 5.3 Update `canCheckout` in `CartPage` to also require `ageVerificationMethod !== null`

## 6. Checkout Page Wiring

- [x] 6.1 Read `ageVerificationMethod` from `orderState` in `CheckoutPage`
- [x] 6.2 Pass `ageVerificationMethod` to `startVerification` and `retryVerification` calls in the checkout auto-start and retry handlers
