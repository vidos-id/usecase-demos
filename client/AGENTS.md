# client

React + Vite frontend with TanStack Router & React Query, Tailwind CSS, Radix UI.

## Structure

```
src/
  routes/          # TanStack Router file-based routes
  components/      # auth/, dialogs/, guide/, landing/, layout/, ui/ (shadcn)
  lib/             # api-client.ts, auth.ts, utils.ts
```

## Conventions

- Do NOT edit `src/routeTree.gen.ts` (auto-generated). Regenerate routes via `bun run build:client` from repo root.
- API client in `lib/api-client.ts`, access via `useRouteContext({ from: "__root__" })`.
- Path alias: `@/*` → `./src/*`.
- Navigation: Use TanStack Router's `<Link>`/`useNavigate()` — never raw `<a href>` (basepath support).
- Data fetching: `useMutation` for API calls, `useQuery` for polling. Avoid `useEffect` + `useState` for async.
- Route search params: Use Zod schemas directly in `validateSearch`, example: `createFileRoute("/_auth/send/success")({ validateSearch: successSearchSchema, ....`.
- Env: `VITE_VIDOS_DEMO_BANK_SERVER_URL` required.

## Design Language

Modern banking aesthetic with EU Digital Identity focus. Maintain consistency with these patterns:

### Typography

- **Fonts**: DM Sans (body), Space Mono (monospace/data)
- **Labels**: `text-xs uppercase tracking-wider text-muted-foreground font-mono`
- **Headings**: `text-2xl font-bold tracking-tight`

### Colors (defined in index.css)

- Primary: Indigo-tinted (`oklch(0.31 0.14 264)`)
- Backgrounds: Subtle gradients (`bg-gradient-to-br from-primary/90 to-primary`)
- Info boxes: `bg-primary/5 border border-primary/20`
- Error states: `bg-destructive/10 border border-destructive/20`

### Spacing & Borders

- Cards: `rounded-2xl border border-border/60`
- Buttons/inputs: `h-12` for large, `rounded-xl` or `rounded-lg`
- Page padding: `py-8 px-4 sm:px-6 lg:px-8`
- Max widths: `max-w-lg` (forms), `max-w-5xl` (landing)

### Components

- **Icon containers**: `h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center`
- **Status indicators**: `h-2 w-2 rounded-full bg-green-500 animate-pulse`
- **Trust badges**: Shield icon + `font-mono uppercase tracking-wider` text

### Animations (defined in index.css)

- `animate-slide-up`: Entry from below
- `animate-slide-in-right`: Entry from right
- `animate-fade-in`: Opacity transition
- Hover: `transition-transform group-hover:translate-x-1` on arrows

### Layout Patterns

- Progress rail: Sticky left (desktop), fixed top bar (mobile)
- Split panels: `grid lg:grid-cols-2 gap-12` for auth pages
- Form pages: Centered `max-w-lg mx-auto`
- Success pages: Centered icon + large amount display

## Deployment

Static build to GitHub Pages. Set `VITE_VIDOS_DEMO_BANK_SERVER_URL` at build time.
