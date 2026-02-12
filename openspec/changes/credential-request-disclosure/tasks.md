## 1. Shared Package - Claims Definitions

- [x] 1.1 Create `shared/src/lib/claims.ts` with claim label mapping utility
- [x] 1.2 Add claim constants for each flow (signup, signin, payment, loan) in `shared/src/lib/claims.ts`

## 2. Shared Package - API Schema Updates

- [x] 2.1 Update `shared/src/api/signup.ts` - add `requestedClaims` and `purpose` to response schema
- [x] 2.2 Update `shared/src/api/signin.ts` - add `requestedClaims` and `purpose` to response schema
- [x] 2.3 Update `shared/src/api/payment.ts` - add `requestedClaims` and `purpose` to response schema
- [x] 2.4 Update `shared/src/api/loan.ts` - add `requestedClaims` and `purpose` to response schema

## 3. Server - Route Updates

- [x] 3.1 Update `server/src/routes/signup.ts` - import claims from shared, add to response
- [x] 3.2 Update `server/src/routes/signin.ts` - import claims from shared, add to response
- [x] 3.3 Update `server/src/routes/payment.ts` - import claims from shared, add to response
- [x] 3.4 Update `server/src/routes/loan.ts` - import claims from shared, add to response

## 4. Client - Disclosure Component

- [x] 4.1 Create `client/src/components/auth/credential-disclosure.tsx` component
- [x] 4.2 Import and use claim label utility from shared in component
- [x] 4.3 Style component consistently with existing auth components

## 5. Client - Integration

- [x] 5.1 Update `client/src/routes/signup.tsx` - add disclosure before QR/DC API
- [x] 5.2 Update `client/src/routes/signin.tsx` - add disclosure before QR/DC API
- [x] 5.3 Update `client/src/routes/_auth/send/confirm.tsx` - add disclosure (payment)
- [x] 5.4 Update `client/src/routes/_auth/loan/index.tsx` - add disclosure before QR/DC API

## 6. Verification

- [x] 6.1 Run `bun run check-types` - ensure no type errors
- [x] 6.2 Run `bun run lint` - ensure no lint errors
- [x] 6.3 Verify all four flows display credential disclosure correctly
