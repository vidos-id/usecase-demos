## Why

Generic wallet setup, onboarding guidance, and high-level "how it works" content currently lives inside individual demos (`car-rental` and `demo-bank`), which duplicates information and dilutes each demo's story. We need one authoritative, polished guidance experience in `usecases-home` so executive stakeholders and developers get a consistent narrative, while each use case page stays focused on its own Vidos Authorizer API flow.

## What Changes

- Move generic cross-demo guidance (wallet setup, credential issuance prep, shared "how it works") from `usecases/car-rental/` and `usecases/demo-bank/` into dedicated standalone pages in `usecases-home/`.
- Add/extend TanStack Router routes in `usecases-home` for those extracted guide pages so navigation is explicit and scalable.
- Replace extracted generic sections in both use cases with clear links/CTAs that point to the new `usecases-home` guides.
- Use pragmatic cross-app linking: standard `<a>` anchors and direct `VITE_` full URL endpoints (no base URL mapping/resolution layer).
- Keep CTA styling/copy aligned to each use case page language, while linking to the same home guidance destination.
- Rewrite use case-local explanatory content so it only describes that use case's specific communication with Vidos Authorizer API (request creation, QR/deeplink handoff, status progression, and result handling).
- Preserve detail depth from extracted pages, including wallet-specific guide variants and download links currently present in demo-bank.
- Improve information architecture and visual presentation of guide pages for executive readability first, with developer-operational detail second.
- Refactor guide-page UI into smaller reusable components to keep pages maintainable and aligned with workspace style conventions.

## Capabilities

### New Capabilities
- `centralized-demo-guidance`: Provide shared, generic Vidos demo guidance in `usecases-home` as the canonical source for wallet setup, credential prep, and baseline demo navigation/how-to.
- `usecase-specific-authorizer-explanations`: Ensure each use case keeps only scenario-specific explanations of its Vidos Authorizer API interaction and links out for generic setup material.

### Modified Capabilities
- None.

## Impact

- Affected frontends: `usecases-home`, `usecases/car-rental`, and `usecases/demo-bank/client`.
- Affected content/routes: car rental "How it works", demo-bank "Guide", and new/expanded guide sections in home navigator.
- No backend API contract changes; this is UX/content architecture and component composition work.
- Deployment-aware navigation required: home hosted at root path; car-rental and demo-bank can be hosted on subpaths.
- Requires route/link updates, content extraction/migration, and component-level refactoring for smaller page building blocks.
