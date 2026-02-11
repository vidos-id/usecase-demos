## Context

DemoBank is a Bun + Turbo monorepo (client/server/shared) using React + TanStack Router. Currently, no routing structure or UI exists. This change establishes the navigation foundation: landing page, route structure with auth guards, progress indicator for journey tracking, and responsive layouts.

**Current state:**
- TanStack Router installed but no routes configured
- shadcn/ui + Radix UI components available
- No authentication flow implemented yet (auth guards will check placeholder session)
- File-based routing convention (routes in `client/src/routes/`)

**Constraints:**
- Must use TanStack Router file-based routing
- Mobile-first responsive (iPhone SE → 27" desktop)
- Modern banking aesthetic (N26/Revolut style)
- Auto-generated `routeTree.gen.ts` must not be edited

## Goals / Non-Goals

**Goals:**
- Landing page with DemoBank intro, EUDI Wallet explainer, CTAs
- Progress indicator showing journey steps (Intro → Authenticate → Action → Finish)
- Route structure for public (/, /signup, /signin) and protected (/dashboard, /profile, /send/*, /loan/*) routes
- Auth guards redirecting unauthenticated users to `/`
- Reusable layout pattern for auth/unauth flows

**Non-Goals:**
- Actual authentication implementation (placeholder session check)
- Dashboard, profile, send, loan page content (covered in future changes)
- API integration for session management
- User account menu functionality (structure only)

## Decisions

### 1. File-based routing with TanStack Router

**Decision:** Use TanStack Router's file-based routing convention with route files in `client/src/routes/`.

**Rationale:**
- Already installed and project standard
- Type-safe routing with auto-generated route tree
- Natural fit for React + Vite setup
- File structure mirrors URL structure (easy mental model)

**Alternatives considered:**
- React Router v6: Less type-safe, requires manual route config
- Manual routing: Doesn't scale, loses TanStack benefits

**Structure:**
```
routes/
  __root.tsx           - Root layout with Outlet
  index.tsx            - Landing page (/)
  signup.tsx           - Signup flow (/signup)
  signin.tsx           - Signin flow (/signin)
  _auth.tsx            - Protected layout wrapper
  _auth/
    dashboard.tsx      - /dashboard
    profile.tsx        - /profile
    send/
      index.tsx        - /send
      confirm.tsx      - /send/confirm
      success.tsx      - /send/success
    loan/
      index.tsx        - /loan
      success.tsx      - /loan/success
```

### 2. Layout-based route protection with `_auth.tsx`

**Decision:** Use TanStack Router's layout routes (`_auth.tsx`) with `beforeLoad` hook for authentication guards.

**Rationale:**
- Layout routes (`_auth.tsx`) automatically wrap child routes without affecting URLs
- `beforeLoad` hook runs before rendering, ideal for auth checks
- Single point of protection for all authenticated routes
- Redirect to `/` aligns with PRD landing entry point; signin page can still read a redirect param if present

**Alternatives considered:**
- Per-route guards: Duplicates auth logic across every protected route
- HOC wrapper: Breaks TanStack Router's type inference
- Middleware approach: Overcomplicates client-side routing

**Implementation:**
```tsx
// _auth.tsx
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ location }) => {
    const isAuthenticated = checkSession() // placeholder
    if (!isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
})
```

### 3. Progress indicator via route-based context

**Decision:** Progress indicator state derived from current route, passed via React Context from `__root.tsx`.

**Rationale:**
- Route determines journey step (no manual state management)
- Context avoids prop drilling through layout hierarchy
- Single source of truth: URL is state
- Supports dynamic steps based on flow type (signup vs signin, payment vs loan)

**Alternatives considered:**
- Global state (Zustand/Redux): Overkill for simple route-derived state
- Prop drilling: Breaks component isolation, hard to maintain
- URL search params: Clutters URLs, harder to read

**Step mapping:**
```tsx
const stepMap: Record<string, JourneyStep> = {
  '/': 'intro',
  '/signup': 'authenticate',
  '/signin': 'authenticate',
  '/send': 'action',
  '/send/confirm': 'action',
  '/send/success': 'finish',
  '/loan': 'action',
  '/loan/success': 'finish',
  '/dashboard': null, // No progress indicator
}
```

### 4. Component structure: layout hierarchy

**Decision:** Three-layer layout: Root → Auth/Public wrapper → Page content.

**Rationale:**
- `__root.tsx`: Always-visible chrome (header, progress context provider)
- `_auth.tsx`: Protected routes wrapper (auth guard, authenticated header variant)
- Pages: Pure content, no layout concerns

**Alternatives considered:**
- Single layout: Can't differentiate auth/unauth header states
- Per-page layouts: Duplicates header/progress logic

**Hierarchy:**
```
__root.tsx
├── Header (always visible)
├── ProgressProvider (context)
└── Outlet
    ├── Public routes (index, signup, signin)
    └── _auth.tsx (layout wrapper)
        ├── Protected header variant
        └── Outlet
            └── Protected routes (dashboard, send/*, loan/*)
```

### 5. Responsive breakpoints: Mobile-first Tailwind

**Decision:** Use Tailwind's default breakpoints with mobile-first approach.

**Rationale:**
- Matches shadcn/ui conventions (already in project)
- Mobile-first ensures base styles work on smallest screens
- Tailwind breakpoints cover target range (320px → 2560px)

**Breakpoints:**
- Base: < 640px (mobile)
- `sm:` 640px+ (large mobile)
- `md:` 768px+ (tablet)
- `lg:` 1024px+ (desktop)
- `xl:` 1280px+ (large desktop)

**Alternatives considered:**
- Custom breakpoints: Unnecessary, Tailwind defaults proven
- Desktop-first: Requires more overrides, harder to maintain

## Risks / Trade-offs

**[Risk] Placeholder auth check may not reflect real session logic**
→ **Mitigation:** Design auth guard to accept injectable session check function. Future changes swap placeholder for real implementation without structural changes.

**[Risk] Progress indicator route mapping becomes unwieldy as routes grow**
→ **Mitigation:** Centralize mapping in `lib/route-config.ts`. Use route groups or prefixes to programmatically determine steps (e.g., `/send/*` → action step).

**[Risk] Layout route (`_auth.tsx`) adds nesting complexity**
→ **Trade-off:** Accepted. Nesting is intentional—clearer than scattered auth logic. TanStack Router's type inference handles nested routes well.

**[Risk] Route-based state for progress indicator breaks if user manipulates URL**
→ **Trade-off:** Accepted. Client-side routing always trusts URL as state. Auth guards prevent invalid authenticated routes. Invalid public routes show 404 (TanStack Router default).

**[Risk] Mobile-first design may underserve desktop users**
→ **Mitigation:** Test on 1920x1080 and 2560x1440. Add `xl:` utilities for large screens if needed. Desktop banking users expect full-width layouts.

## Migration Plan

**N/A** - This is the initial navigation implementation (no existing routes to migrate).

**Deployment:**
1. Merge routes and layout components
2. TanStack Router auto-generates `routeTree.gen.ts` on build
3. Verify routing with manual testing: /, /signup, /signin, /dashboard (should redirect if unauthenticated)

**Rollback:**
- Remove route files and revert `main.tsx` changes
- No database or API impact (client-only change)

## Open Questions

**Q1: Should progress indicator show on dashboard/profile routes?**
→ **Answer:** No. Progress indicator is for linear flows (signup → action → finish). Dashboard is a hub, not a journey step. Design omits progress on dashboard/profile.

**Q2: How should "reset demo data" account menu action work?**
→ **Answer:** Out of scope for this change. Include menu structure in header, but disable/stub reset action. Future change implements backend reset endpoint.

**Q3: Should we preserve redirect destination after signin?**
→ **Answer:** Yes. If we later add redirect params, use them when present; default remains `/` per PRD.
