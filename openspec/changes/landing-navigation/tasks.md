## 1. Router Structure & Layouts

- [x] 1.1 Create `__root.tsx` with base layout structure (header, progress context provider, Outlet)
- [x] 1.2 Create `_auth.tsx` layout route with `beforeLoad` authentication guard
- [x] 1.3 Create placeholder route files for all defined routes (index, signup, signin, dashboard, profile, send/*, loan/*)
- [x] 1.4 Create `lib/route-config.ts` with route-to-step mapping and journey configuration
- [x] 1.5 Configure TanStack Router to auto-generate `routeTree.gen.ts` on build
- [x] 1.6 Implement placeholder session check function (returns false for now)

## 2. Landing Page Content

- [x] 2.1 Implement landing page hero section with DemoBank branding and tagline
- [x] 2.2 Add EUDI Wallet explainer (1-2 sentences) to landing page
- [x] 2.3 Implement "Create Account" primary CTA button linking to `/signup`
- [x] 2.4 Implement "Sign In" CTA button linking to `/signin`
- [x] 2.5 Apply modern banking aesthetic styling (N26/Revolut inspired)
- [x] 2.6 Add mobile-responsive layout for landing page (320px → 2560px)

## 3. Progress Indicator Component

- [x] 3.1 Create `components/ui/progress-indicator.tsx` component structure
- [x] 3.2 Implement four journey steps display (Intro → Authenticate → Action → Finish)
- [x] 3.3 Add visual highlighting for current step based on route
- [x] 3.4 Add completed step indicators (checkmarks or filled circles)
- [x] 3.5 Implement route-based state derivation using React Context
- [x] 3.6 Add conditional rendering logic (hide on dashboard/profile routes)
- [x] 3.7 Make progress indicator mobile-responsive (abbreviated labels on small screens)

## 4. Auth Guard Setup

- [x] 4.1 Implement `beforeLoad` hook in `_auth.tsx` with session check
- [x] 4.2 Configure redirect to `/` when session check fails
- [x] 4.3 Add architecture support for preserving redirect destination (placeholder)
- [x] 4.4 Test auth guard redirects for all protected routes (/dashboard, /profile, /send/*, /loan/*)
- [x] 4.5 Verify public routes remain accessible without authentication

## 5. Responsive Layout Polish

- [x] 5.1 Create navigation header component with DemoBank branding
- [x] 5.2 Implement account menu for authenticated users (Sign Out, Reset Demo Data structure only)
- [x] 5.3 Add progress indicator slot positioning (below header, above content)
- [x] 5.4 Configure main content area with proper scrolling behavior
- [x] 5.5 Ensure consistent padding/spacing across all routes
- [x] 5.6 Test responsive breakpoints: 320px (mobile), 768px (tablet), 1920px (desktop), 2560px (large desktop)
- [x] 5.7 Apply Tailwind mobile-first utilities (sm:, md:, lg:, xl:)

## 6. Manual Verification

- [x] 6.1 Verify landing page renders at `/` with hero, explainer, and CTAs
- [x] 6.2 Verify "Create Account" navigates to `/signup`
- [x] 6.3 Verify "Sign In" navigates to `/signin`
- [x] 6.4 Verify progress indicator shows correct step for each route
- [x] 6.5 Verify progress indicator hidden on `/dashboard` and `/profile`
- [x] 6.6 Verify unauthenticated access to `/dashboard` redirects to `/`
- [x] 6.7 Verify responsive layout on mobile (320px), tablet (768px), and desktop (1920px)
- [x] 6.8 Verify account menu displays for authenticated users (structure only)
- [x] 6.9 Verify 404 page displays for unknown routes
- [x] 6.10 Run `bun run check-types` to verify TypeScript type safety
