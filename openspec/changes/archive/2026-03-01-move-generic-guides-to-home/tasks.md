## 1. Content Inventory and IA Plan

- [x] 1.1 Inventory current "how it works" and "guide" content in `usecases/car-rental` and `usecases/demo-bank/client` and tag each section as generic vs use-case-specific.
- [x] 1.2 Define target information architecture in `usecases-home` for generic guidance (wallet setup, credential prep, shared demo flow orientation).
- [x] 1.3 Capture and map wallet-specific guide variants and download links from `usecases/demo-bank/client` to equivalent `usecases-home` pages.
- [x] 1.4 Define retained use-case-specific Authorizer API explanation sections for car-rental and demo-bank pages.

## 2. Cross-App URL Configuration

- [x] 2.1 Add `VITE_` environment variables that store complete cross-app destination URLs (full href endpoints) in each affected frontend workspace.
- [x] 2.2 Use env URL values directly in `<a href>` for cross-app navigation (no base URL + path resolution logic).
- [x] 2.3 Document local and production env setup for cross-app links in workspace READMEs or env example files.

## 3. Home App Generic Guide Implementation

- [x] 3.1 Add/expand TanStack Router routes in `usecases-home` for separate guide pages (wallet setup, credential prep, how demos work).
- [x] 3.2 Implement home guide sections as small extracted components aligned with `usecases-home` design language.
- [x] 3.3 Ensure home guide copy and layout prioritize executive narrative first with developer detail second, with developer-detail sections always visible.
- [x] 3.4 Preserve original guide detail depth in migrated pages, including per-wallet instructions and wallet-specific download links.

## 4. Car-Rental Guide Refactor

- [x] 4.1 Remove generic wallet/setup/how-to content from car-rental guide/how-it-works pages.
- [x] 4.2 Keep and refine only car-rental-specific Vidos Authorizer API communication explanation.
- [x] 4.3 Add visible cross-app CTA blocks linking to home generic guidance using `<a>` anchors with env-configured absolute URLs, using car-rental tone and styling.
- [x] 4.4 Extract large page sections into smaller components where needed.

## 5. Demo-Bank Guide Refactor

- [x] 5.1 Remove generic wallet/setup/how-to content from demo-bank guide page, including wallet setup/configuration material.
- [x] 5.2 Keep and refine only demo-bank-specific Vidos Authorizer API communication explanation.
- [x] 5.3 Add visible cross-app CTA blocks linking to home generic guidance using `<a>` anchors with env-configured absolute URLs, using demo-bank tone and styling.
- [x] 5.4 Extract large guide sections into smaller components where needed.

## 6. Validation and Quality Checks

- [x] 6.1 Validate cross-app links work in local development and production-like env configuration for all three apps.
- [x] 6.2 Validate navigation behavior with deployment paths where `usecases-home` is at root and car-rental/demo-bank run under subpaths.
- [x] 6.3 Verify responsive behavior and visual consistency of updated guide pages on desktop and mobile.
- [x] 6.4 Run `bun run check-types` and `bun run lint` and resolve issues introduced by these changes.
