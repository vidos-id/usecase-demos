## Context

Today, `usecases/car-rental` and `usecases/demo-bank/client` both include generic onboarding guidance (wallet setup, credential preparation, broad "how it works" material) alongside use case-specific explanations. This causes duplicated content, inconsistent wording, and harder maintenance.

The home navigator (`usecases-home`) already acts as the entrypoint for all demos and is the natural canonical location for cross-demo guidance. The requested audience priority is executive/investor communication first and developer enablement second, so structure and clarity matter as much as correctness.

Constraints:
- Keep use case-specific code in each use case workspace; shared navigation/guidance belongs in `usecases-home`.
- Preserve strict TypeScript and existing routing patterns.
- Keep components small and extracted into separate files when possible.
- No backend/API contract changes.
- Deployment paths differ: `usecases-home` is served from root path, while car-rental and demo-bank are served via subpaths.

## Goals / Non-Goals

**Goals:**
- Centralize generic guides and wallet setup content in `usecases-home` as the single source of truth.
- Leave car-rental and demo-bank pages with only scenario-specific explanation of Vidos Authorizer API communication.
- Add obvious cross-links from use case pages to home guides, so users can recover missing generic context quickly.
- Improve content hierarchy and visual structure for an executive audience while still usable for developers.
- Refactor large guide pages into smaller composable sections/components.

**Non-Goals:**
- Changing Authorizer API behavior, payloads, or backend services.
- Rewriting unrelated product flows (signup/signin/payment/loan logic).
- Introducing a shared cross-workspace component package in this change.

## Decisions

### 1) Canonical generic guidance lives in `usecases-home`
- Decision: Move wallet setup, credential issuance prep, and generic "how the demo works" guidance to dedicated standalone routes in `usecases-home`.
- Decision detail: Implement/expand TanStack Router route tree in `usecases-home` for extracted guidance pages (not inline-only homepage sections).
- Rationale: Avoids duplication and ensures one consistent message for stakeholders.
- Alternative considered: Keep copies per use case and try to synchronize manually.
- Why not chosen: High drift risk and repeated maintenance.

### 2) Use case guides become API-flow specific
- Decision: In car-rental and demo-bank, keep only content that explains that demo's communication with Vidos Authorizer API (request initiation, QR/deeplink handoff, status transitions, terminal outcomes, disclosed claim usage in business flow).
- Rationale: Keeps each demo page focused and technically meaningful.
- Alternative considered: Keep mixed generic + specific sections but visually split.
- Why not chosen: Still duplicates generic material and weakens narrative focus.

### 3) Replace removed sections with explicit CTA/link blocks
- Decision: Add "Need wallet setup?" and "Need generic walkthrough?" link blocks in extracted locations, pointing to `usecases-home` guides.
- Decision detail: Because navigation crosses separate applications, use standard `<a>` anchors with absolute URLs instead of in-app router links.
- Rationale: Preserves discoverability after extraction and avoids dead ends.
- Alternative considered: Silent removal without links.
- Why not chosen: Increases confusion, especially for first-time evaluators.

### 3.1) Cross-app URL configuration via environment variables
- Decision: Configure cross-app URLs with explicit `VITE_` env vars containing complete destination URLs (full href endpoints) for home, car-rental, and demo-bank navigation targets.
- Decision detail: Keep implementation simple - use env-provided full URLs directly in `<a href>` without runtime base-path mapping or URL composition logic.
- Rationale: These apps deploy independently; hardcoded hosts break portability and local setup.
- Alternative considered: hardcode production domains and infer localhost in development.
- Why not chosen: brittle and error-prone across deployment targets.

### 4) Small, composable page architecture
- Decision: Split guide pages into focused components (hero/context, prerequisites, wallet setup matrix, protocol flow narrative, quick links, FAQ/notes).
- Rationale: Aligns with project guidance for small files and supports iterative content improvements.
- Alternative considered: Single monolithic route component.
- Why not chosen: Harder to maintain and review.

### 4.1) Preserve extracted detail depth
- Decision: Migrated guidance pages in `usecases-home` preserve detail depth from source pages, including wallet-specific variants and wallet-specific download links from demo-bank.
- Rationale: Prevents loss of practical onboarding value during centralization.
- Alternative considered: high-level rewrite only.
- Why not chosen: removes useful operational detail for evaluators and developers.

### 5) Audience-tiered content strategy
- Decision: Write each page with two visible layers: (a) concise executive explanation and value framing, (b) always-visible developer detail sections below.
- Rationale: Matches stakeholder priority while keeping technical usefulness.
- Alternative considered: collapsible developer-detail blocks.
- Why not chosen: Misaligned with primary audience goal.

### 6) Preserve home app design language for migrated generic pages
- Decision: Any extracted generic page/section moved into `usecases-home` follows `usecases-home` typography, spacing, visual tokens, and component patterns.
- Rationale: Home app is the canonical navigation/guidance surface and must remain visually coherent.
- Alternative considered: porting styles directly from source use case pages.
- Why not chosen: creates mixed visual language and weakens trust for executive-facing walkthroughs.

## Risks / Trade-offs

- [Risk] Broken or stale links between use cases and home guides after route changes -> Mitigation: central env-backed URL config and route-level smoke checks.
- [Risk] Full URL env vars may drift across environments -> Mitigation: document required env keys with explicit local/prod examples and verify links in smoke checks.
- [Risk] Over-centralized content may become too generic and miss use-case nuance -> Mitigation: enforce rule that each use case page includes its own Authorizer API sequence narrative.
- [Risk] Large visual/content refresh can introduce regressions on mobile -> Mitigation: validate responsive breakpoints for all modified guide routes.
- [Risk] Executive-focused wording may reduce developer precision -> Mitigation: include explicit developer-detail subsections with concrete API flow states.

## Migration Plan

1. Inventory and tag existing guide/how-it-works content in `car-rental` and `demo-bank` as generic vs use-case-specific.
2. Create/expand standalone TanStack Router pages in `usecases-home` to host all generic content.
3. Define `VITE_` full URL endpoint vars for cross-app navigation in all three apps and consume them directly in anchors.
4. Update car-rental and demo-bank guide pages: remove generic sections, keep API-flow-specific sections, add anchor-based CTA links to home guides.
5. Refactor modified pages into smaller extracted components.
6. Verify routing and responsive rendering across desktop/mobile in all three apps.
7. Run workspace checks (types/lint/build) and fix any regressions.

Rollback:
- Revert frontend route/content commits for affected workspaces.
- Because no backend contracts change, rollback is low risk and isolated to UI content.

## Open Questions

- Home guidance will be split into dedicated pages under TanStack Router (wallet setup, credential preparation, and how demos work) to keep content scannable and navigable.
- CTA copy will use per-use-case tone and language, and fit each use case page's styling while still linking to the same home guidance destinations.
- Developer-detail sections will be always visible (not collapsible).
