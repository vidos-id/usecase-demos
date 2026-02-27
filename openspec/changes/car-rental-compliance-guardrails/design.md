## Context

The demo should remain high-impact while still aligning with core standards semantics. Guardrails here are intentionally lightweight: enough to avoid clearly incorrect claims, without diluting the wow factor or overloading screens with compliance text.

## Goals / Non-Goals

**Goals:**
- Keep request/response semantics aligned with OpenID4VP/DCQL and ISO 18013-5 mDL identifiers.
- Define concise copy rules for what the UI can claim about disclosed data and verification outcomes.
- Preserve fast-paced demo UX while reducing obvious misrepresentation risk.

**Non-Goals:**
- Building formal compliance workflows or heavy review gates.
- Turning the demo into legal/compliance training content.
- Removing expressive product messaging and wow elements.

## Decisions

### 1) Apply "light guardrails" model
Decision:
- Keep only a small mandatory set of standards-alignment rules and forbidden claims.

Rationale:
- Balances correctness with demo speed and impact.

Alternative considered:
- Full compliance checklist with strict review process.

Why not:
- Slows delivery and reduces narrative energy.

### 2) Enforce canonical mDL identifiers in query semantics
Decision:
- Use `org.iso.18013.5.1.mDL` and `org.iso.18013.5.1` semantics consistently in mDL query modeling.

Rationale:
- This is low-cost, high-value standards alignment.

Alternative considered:
- Flexible ad-hoc identifiers for speed.

Why not:
- Increases risk of technically incorrect demo explanation.

### 3) Keep verification language source-attributed
Decision:
- Verification outcomes shown in UI are attributed to authorizer policy result output.

Rationale:
- Avoids false implication that browser-only logic performs full trust-chain verification.

Alternative considered:
- Generic "verified" labels without attribution.

Why not:
- Can be interpreted as overclaiming technical assurance.

### 4) Keep limitations concise and product-friendly
Decision:
- Use short, non-intrusive wording for demo boundaries rather than long disclaimers.

Rationale:
- Maintains momentum and wow effect during walkthrough.

Alternative considered:
- Detailed legal-style disclaimer blocks.

Why not:
- Distracting and not needed for this demo objective.

## Risks / Trade-offs

- [Too few guardrails can allow inaccurate messaging drift] -> Mitigation: central approved copy snippets for verification/disclosure statements.
- [Too much caution can flatten demo impact] -> Mitigation: keep compliance text minimal and place it contextually.
- [Spec semantics accidentally drift across screens] -> Mitigation: reuse shared terminology in request and result components.

## Migration Plan

1. Define approved and forbidden copy patterns.
2. Align request semantics for mDL docType/namespace and DCQL mapping.
3. Apply copy updates to verification and confirmation UX.
4. Validate final messaging for consistency in key screens.

Rollback:
- Retain current UX copy while preserving semantic identifier alignment if wording adjustments regress demo quality.

## Open Questions

- None.
