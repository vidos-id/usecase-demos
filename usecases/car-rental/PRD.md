# Car Rental mDL + PID Demo PRD (Single Source of Truth)

Status: Draft for implementation kickoff  
Owner: Car Rental Demo Team  
Use case path: `usecases/car-rental/`

---

## 1. Why This Exists

Build a frontend-only car-rental demo that looks and feels like a real booking site, but demonstrates one core thing clearly:

- A customer can complete rental booking using wallet-presented **PID + mDL** credentials, requested via **DCQL**, processed via **Vidos Authorizer**, then proceed to payment confirmation and self pickup details.

This document is the handoff artifact for delegation. Teams should be able to execute without additional product clarification.

---

## 2. Product Scope

### 2.1 In Scope (MVP)

1. Frontend-only web app experience for car rental booking.
2. Booking flow with realistic steps: search/select/review/verify/payment/confirmation.
3. Credential request for both:
   - PID credential (personal identity attributes)
   - mDL credential (driving license attributes)
4. DCQL-based verifier request modeling.
5. Vidos Authorizer integration model based on `authorizerId`.
6. Local persistence (state + localStorage) of:
   - booking data,
   - authorizer session metadata,
   - policy result summary,
   - disclosed claim subset used by UI.
7. Mocked payment step with **pre-filled, non-editable card section**.
8. Confirmation page with booking details + disclosed credential highlights + self-pickup instructions (locker ID + PIN).
9. Responsive UX for desktop and mobile.

### 2.2 Out of Scope (MVP)

1. Backend APIs or database.
2. Real payment processing/acquiring.
3. In-person counter reverification flow.
4. Production-grade cryptographic verification in browser-only client.
5. Revocation/OCSP/CRL processing done by this demo client.
6. Full issuer trust-chain visualization.

---

## 3. Target Users and Demo Context

### 3.1 Primary Personas

1. Business audience (customer/investor): wants clear value and friction reduction.
2. Developer audience: wants clear integration concepts and reusable flow patterns.
3. Demo operator: needs predictable flow and robust fallback behavior.

### 3.2 Usage Context

1. Live walkthrough in meetings.
2. Self-guided exploration in browser.
3. Reset and rerun quickly.

---

## 4. User Journey (Canonical)

1. User lands on rental site, searches location/dates.
2. User selects a car and reviews booking summary.
3. User proceeds to identity + driving verification.
4. Site requests PID + mDL from wallet via verifier flow.
5. Site fetches authorizer result (`authorizerId`) and extracts policy/disclosed data.
6. User sees mocked payment card (read-only) and confirms booking.
7. User sees final confirmation:
   - booking reference,
   - verified-for-rental outcome,
   - key disclosed attributes (name/photo/privileges/etc.),
   - self pickup instructions with locker ID + PIN.

---

## 5. Required End-to-End Experience

### 5.1 Booking Phase

Must include:

1. Pickup location selector.
2. Pickup/return date-time selector.
3. Car list/cards with at least:
   - vehicle class,
   - transmission,
   - seats,
   - price/day,
   - total estimate.
4. Booking summary before verification step.
5. Creation of `bookingId` before credential request begins.

### 5.2 Verification Phase (Core)

Must include:

1. Clear statement that both PID + mDL are required.
2. Display of verification states:
   - request created,
   - waiting for wallet presentation,
   - processing policy results,
   - success/failure.
3. Binding of `authorizerId` to `bookingId`.
4. Retrieval and storage of policy results and disclosed attributes.
5. Explicit UX text on selective disclosure and consent.

### 5.3 Payment Phase (Mock)

Must include:

1. Polished payment card component.
2. Card details prefilled by design.
3. Inputs non-editable.
4. One explicit confirm action to continue.
5. Copy that this is simulated payment.

### 5.4 Confirmation Phase

Must include:

1. Booking reference and rental summary.
2. Self-pickup details:
   - pickup point,
   - locker ID,
   - locker PIN,
   - short pickup instructions.
3. Credential highlights (wow section):
   - full name,
   - portrait/photo,
   - mDL number,
   - mDL expiry,
   - driving privileges/categories,
   - issuing authority/country.
4. Eligibility interpretation from policy output (e.g., eligible for selected vehicle class).

---

## 6. Functional Requirements (Detailed)

### FR-01 Booking State Creation

The app must create a booking context before verifier request. Minimum booking context:

- `bookingId`
- location
- dates
- selected vehicle and price
- booking status

Acceptance criteria:

1. User cannot enter verification phase without a valid booking context.
2. Refresh retains booking context.

### FR-02 Dual Credential Request

The verifier request must include both PID and mDL credential queries via DCQL representation.

Acceptance criteria:

1. Request model includes two credential entries (PID + mDL).
2. Response parsing maps each returned credential to the correct request ID.

### FR-03 Authorizer Session Correlation

The app must persist and correlate:

- `authorizerId`
- `bookingId`
- request timestamp/status

Acceptance criteria:

1. Correlation survives page refresh.
2. A historical booking detail can show linked `authorizerId` metadata.

### FR-04 Policy Result Consumption

The app must consume and show policy results from authorizer response.

Acceptance criteria:

1. UI shows passed/failed/pending states.
2. Failure state blocks progression to confirmation unless explicit demo override mode is enabled.

### FR-05 Disclosed Data Normalization

The app must normalize disclosed claims into a stable UI model.

Acceptance criteria:

1. Confirmation page renders available identity/driving data consistently.
2. Missing claims handled gracefully (no crash/empty broken layout).

### FR-06 Mock Payment Lockdown

Payment UI must be display-only.

Acceptance criteria:

1. No editable card fields.
2. Confirm action is deterministic and always local.

### FR-07 Demo Resilience

App must provide fallback for non-live verification demos.

Acceptance criteria:

1. Team can run full demo without external dependency failures.
2. Fallback mode is visibly marked as simulated.

---

## 7. Compliance and Standards Requirements

This section is normative for demo messaging and implementation behavior.

### 7.1 OpenID4VP / DCQL Requirements

Must:

1. Generate a new cryptographic nonce per authorization request.
2. Keep request-response correlation integrity (`state` if used; mapped booking context).
3. Represent credential requirements using DCQL structure.
4. Preserve credential ID mapping between request and response payload handling.

Must not:

1. Reuse nonce across transactions.
2. Treat uncorrelated response as valid booking authorization.

### 7.2 ISO/IEC 18013-5 (mDL) Requirements

Must:

1. Represent mDL document type as `org.iso.18013.5.1.mDL` in query semantics.
2. Represent standard namespace as `org.iso.18013.5.1` where applicable.
3. Request specific attributes only (selective disclosure posture).

Should:

1. Prefer minimum attribute set for eligibility checks when possible.

Must not:

1. Claim that full mDL document contents were required if only subset was requested.

### 7.3 SD-JWT VC / Selective Disclosure Messaging

Must:

1. Use language like "disclosed/presented claims" for displayed attributes.
2. Attribute verification outcomes to policy result from authorizer.

Must not:

1. Claim frontend alone performed full issuer trust-chain cryptographic verification.
2. Claim impossible guarantees (e.g., "data cannot be retained").

### 7.4 Compliance-safe UX Copy Rules

Approved patterns:

1. "Wallet disclosed the requested attributes for this booking."
2. "Verification status based on authorizer policy result."

Forbidden patterns:

1. "Browser verified issuing authority certificates" (unless actually implemented).
2. "No retention of disclosed data is possible."

---

## 8. Data Model (Source of Truth)

### 8.1 Booking Entity

Fields:

- bookingId
- location
- pickupDateTime
- returnDateTime
- vehicleSelection
- priceBreakdown
- bookingStatus (`draft | awaiting_verification | verified | payment_confirmed | completed | failed`)

### 8.2 Authorizer Session Entity

Fields:

- authorizerId
- bookingId
- createdAt
- expiresAt (if provided)
- requestStatus (`created | pending_wallet | processing | success | rejected | expired | error`)
- policySummary

### 8.3 Policy Result Entity

Fields:

- policyId
- policyName
- status (`passed | failed | error`)
- reasonCode
- reasonText
- evaluatedAt

### 8.4 Disclosed Credential Data Entity

Fields (normalized view model):

- `pid`: name, birth date, portrait (if present)
- `mdl`: document number, expiry date, issuing authority/country, driving privileges, restrictions/conditions if present
- provenance metadata: source credential id/type

### 8.5 Persistence Rules

Must persist locally:

1. Booking + authorizer correlation.
2. Policy summary and disclosed claim subset used by UI.

Must not persist locally by default:

1. Unneeded raw payload fields not used for demo UI.

---

## 9. State Transitions

### 9.1 Booking Lifecycle

`draft -> awaiting_verification -> verified -> payment_confirmed -> completed`

Failure branches:

- `awaiting_verification -> failed` (rejected/expired/error)

### 9.2 Verification Lifecycle

`created -> pending_wallet -> processing -> success | rejected | expired | error`

Rules:

1. Payment step available only after `success`.
2. Confirmation step available only after payment confirm.

---

## 10. UX and Content Requirements

### 10.1 Core UX Principles

1. Looks like a real rental site, not a protocol playground.
2. Verification stage must still expose enough transparency for technical viewers.
3. Clear and minimal language; avoid legal/marketing fluff.

### 10.2 Required Screens

1. Search + car listing.
2. Booking review.
3. Wallet verification.
4. Mock payment.
5. Confirmation with credential highlights and pickup instructions.

### 10.3 Mandatory UI Elements

1. Verification status component with clear current state.
2. Policy result summary component.
3. Credential highlights component on confirmation.
4. Demo mode indicator when fallback is active.

---

## 11. Failure and Edge Cases

Must support and test:

1. Wallet flow not completed (timeout/expiry).
2. Policy failed due to missing/invalid required claim.
3. Missing optional portrait claim.
4. Reload during pending verification.
5. Corrupted localStorage entries.

Required behavior:

1. No dead-end screens; always provide retry or restart path.
2. Errors must explain next action in one sentence.

---

## 12. Telemetry / Demo Traceability (Frontend-only)

Must capture in local debug context:

1. bookingId
2. authorizerId
3. verification status timeline
4. policy result snapshot

Purpose: support operator troubleshooting and developer explanation during demos.

---

## 13. Delivery Plan: Epics, Tasks, Acceptance, Dependencies

Each task is delegation-ready and independent enough for assignment.

### Epic 1 - Booking Experience Foundation

Goal: deliver realistic booking flow up to verification handoff.

Tasks:

1. Define booking journey and user decisions.
   - Acceptance: state transitions documented and implemented in UI behavior.
2. Implement search/list/select/review UX.
   - Acceptance: user can create valid booking context and proceed.
3. Add booking persistence and restore behavior.
   - Acceptance: refresh restores in-progress booking.

Dependencies: none.

### Epic 2 - Verifier Request and Correlation

Goal: run PID + mDL request flow with reliable correlation.

Tasks:

1. Define DCQL query contract for PID + mDL claims.
   - Acceptance: contract reviewed and mapped to expected response ids.
2. Implement authorizer session creation and correlation to booking.
   - Acceptance: `authorizerId` persisted and retrievable by booking.
3. Implement verification lifecycle UI states.
   - Acceptance: pending/success/failure/expired represented and testable.

Dependencies: Epic 1 booking context.

### Epic 3 - Policy and Disclosed Data Consumption

Goal: convert authorizer output into understandable customer/developer UI.

Tasks:

1. Normalize policy results to shared model.
   - Acceptance: policy summary renders consistently across scenarios.
2. Normalize disclosed PID/mDL claims for UI.
   - Acceptance: confirmation can display required fields when present.
3. Add handling for missing optional claims.
   - Acceptance: no runtime failure when optional data absent.

Dependencies: Epic 2 request/response flow.

### Epic 4 - Mock Payment Stage

Goal: complete realistic checkout feel without real payment integration.

Tasks:

1. Build read-only payment card display.
   - Acceptance: fields are visible and non-editable.
2. Implement local-only confirmation action.
   - Acceptance: clicking confirm advances to final stage deterministically.
3. Add explicit "simulated payment" labeling.
   - Acceptance: labeling present and understandable.

Dependencies: successful verification state from Epic 2.

### Epic 5 - Confirmation and Self Pickup Output

Goal: produce high-impact completion screen.

Tasks:

1. Build booking confirmation summary module.
   - Acceptance: includes booking id and rental details.
2. Build credential highlight module.
   - Acceptance: shows required disclosed fields from normalized model.
3. Build self pickup instruction module.
   - Acceptance: locker ID + PIN + short instructions shown.
4. Add eligibility interpretation text from policy status.
   - Acceptance: clear pass/fail statement linked to policy outcomes.

Dependencies: Epics 3 and 4.

### Epic 6 - Compliance-safe Messaging and Spec Alignment

Goal: prevent misleading claims and keep standards alignment explicit.

Tasks:

1. Create approved copy set for verification/disclosure language.
   - Acceptance: all verification copy reviewed against section 7 rules.
2. Add validation checklist for mDL docType/namespace/DCQL representation.
   - Acceptance: checklist passes in QA review.
3. Add limitation disclosures for frontend-only boundaries.
   - Acceptance: boundary note present in relevant screens.

Dependencies: Epics 2 and 3.

### Epic 7 - Demo Reliability and Operations

Goal: ensure repeatable demos regardless of live dependency volatility.

Tasks:

1. Implement deterministic fallback mode.
   - Acceptance: full journey works in fallback mode end-to-end.
2. Add restart/reset mechanism for demo runs.
   - Acceptance: one action resets local state cleanly.
3. Add local debug timeline view for operator.
   - Acceptance: shows booking/authorizer status history.

Dependencies: Epics 1-5 base flows.

### Epic 8 - QA, UAT, and Handover

Goal: deliver delegation-ready artifact and signoff confidence.

Tasks:

1. Define scenario test matrix (happy + failure paths).
   - Acceptance: matrix covers all section 11 edge cases.
2. Execute device/responsive checks.
   - Acceptance: desktop + mobile flows validated.
3. Produce handover notes for operators and developers.
   - Acceptance: runbook includes startup, fallback, reset, known limitations.

Dependencies: Epics 1-7.

---

## 14. QA Acceptance Matrix (Minimum)

1. Happy path: complete booking with successful verification and confirmation.
2. Verification rejected path: cannot proceed to payment.
3. Verification expired path: user can retry cleanly.
4. No portrait path: confirmation still renders properly.
5. Refresh during pending path: state recovers.
6. Corrupt local storage path: app resets safely.
7. Fallback mode path: full completion without live external dependency.

---

## 15. Demo Limits (Mandatory Disclosure)

Must be documented and available in-app (or operator notes):

1. Frontend-only demo; no backend persistence.
2. Payment is simulated.
3. Cryptographic validation details are represented via authorizer outputs, not independently re-implemented in browser.

---

## 16. Future Evolution (Beyond MVP)

1. Replace mocked payment with credential-based payment data flow.
2. Add pickup counter reverification journey.
3. Add backend audit trail and persistent booking history.
4. Add richer policy introspection and trust metadata visualization.

---

## 17. Implementation Guardrails

1. Reuse architectural patterns from `usecases/demo-bank/` as reference only.
2. Do not cross-import runtime code from other usecases.
3. Prefer router/query/state stack already chosen for this use case.
4. Keep modules small and delegation-friendly.

---

## 18. Final Definition of Done

This PRD is considered delivered when all below are true:

1. MVP flow works from search to confirmation in frontend-only mode.
2. PID + mDL DCQL request and `authorizerId` correlation are operational.
3. Policy + disclosed data appear on confirmation with compliant wording.
4. Mock payment is read-only and integrated in journey.
5. Self pickup locker + PIN flow is present.
6. Failure paths and fallback path are implemented and testable.
7. Handover artifacts exist so another team can run and explain the demo without original authors.
