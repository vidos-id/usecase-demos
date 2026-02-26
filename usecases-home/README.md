# usecases-home

Home navigator app for the Vidos use case demos.

## Purpose

- List and link all available use case demos.
- Provide a rough guide on how to use the demos.
- Provide wallet download/setup guidance.
- Provide credential issuance guidance.
- Share general Vidos context information.

## Design Language

The UI bridges two reference aesthetics into a single cohesive style:

| | EUDI Use Case Manuals | Vidos | This App |
|---|---|---|---|
| **Palette** | Light w/ EU-blue accents | Black/white monochrome | Monochrome base + EU-blue accent |
| **Typography** | Institutional serif/sans mix | Inter + Lexend (clean sans) | DM Sans (body) + Space Mono (technical) |
| **Cards** | Light bg, subtle shadow, rounded | Sharp borders, minimal | Subtle border + hover lift |
| **Categorization** | Filter chips, tag pills | Minimal | Badge chips (shadcn Badge) |
| **Layout** | Card grids, alternating sections | Alternating white/gray sections | Section alternation (white / off-white) |
| **Tone** | Approachable, educational | Enterprise, authoritative | Professional but accessible |
| **Radius** | Soft rounded | Tight | 0.5rem (tight, not bubbly) |

### Design Principles

1. **Monochrome first** -- Black, white, and grays carry 95% of the UI. Color is reserved for meaning.
2. **Single accent** -- EU-blue (`--eu-blue`) is the only chromatic color. Used for trust signals, active states, and primary CTAs.
3. **Strong hierarchy** -- Large bold headings, medium body text, small monospace labels create clear visual layers.
4. **Card-based navigation** -- Use cases are presented as cards with icon, category badge, description, and status indicator.
5. **Section rhythm** -- Alternating white (`background`) and off-white (`surface`) sections break up long pages.
6. **Sparse decoration** -- No illustrations, gradients, or ornamental elements. Content and typography do the work.

### Color Tokens

| Token | Purpose | Light | Dark |
|---|---|---|---|
| `--background` | Page background | white | near-black |
| `--foreground` | Primary text | near-black | near-white |
| `--eu-blue` | Trust/institutional accent | `oklch(0.424 0.164 261.1)` | `oklch(0.588 0.164 261.1)` |
| `--eu-blue-light` | Subtle blue backgrounds | `oklch(0.95 0.02 261.1)` | `oklch(0.25 0.04 261.1)` |
| `--surface` | Alternating section bg | `oklch(0.985)` | `oklch(0.175)` |
| `--border` | Card/element borders | light gray | white/10% |
| `--muted-foreground` | Secondary text | mid gray | light gray |

### Typography

- **Body**: DM Sans (loaded via Google Fonts in `index.html`)
- **Monospace/Technical**: Space Mono (labels, code, identifiers)
- **Headings**: DM Sans semibold with tight tracking (`tracking-tight`)
- **Mono labels**: Uppercase, extra-small, wide-tracked (`mono-label` class)

### CSS Utility Classes

Defined in `src/index.css` under `@layer components`:

| Class | Purpose |
|---|---|
| `.container-page` | Max-width centered container (1152px) with horizontal padding |
| `.section-alt` | Off-white background for alternating sections |
| `.card-hover` | Subtle shadow + lift on hover |
| `.btn-eu-blue` | EU-blue background button variant |
| `.mono-label` | Space Mono uppercase small label |
| `.status-dot` | Small colored circle indicator |
| `.status-dot--active` | Green dot (live) |
| `.status-dot--pending` | Amber dot (coming soon) |
| `.status-dot--inactive` | Gray dot (inactive) |

### Tailwind Custom Colors

Available in any Tailwind utility (e.g. `text-eu-blue`, `bg-surface`):

- `eu-blue`, `eu-blue-light`, `eu-blue-foreground`
- `surface`, `surface-raised`

### Component Patterns

- **Use Case Card**: `Card` + icon in colored square + `Badge` for category + status dot + action button
- **Filter Row**: Row of `Badge` components (outline for inactive, default for active)
- **Section**: `mono-label` overline + heading + description + content grid
- **Header**: Wordmark + vertical separator + nav links + outline button CTA
- **Steps**: Numbered circles + icon + title + description in grid
