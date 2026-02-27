# usecases-home

Home navigator app for the Vidos EUDI use case demos.

## Purpose

- List and link all available use case demos.
- Provide a rough guide on how to use the demos.
- Provide wallet download/setup guidance.
- Provide credential issuance guidance.
- Share general Vidos context information.

## Design Language

The UI leans into the **EU institutional aesthetic** of the [EUDI Use Case Manuals](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/896827987/Use+case+manuals) while retaining the structural clarity of [Vidos](https://vidos.id/).

### Source of Influence

| Aspect | EUDI Use Case Manuals | Vidos | This App |
|---|---|---|---|
| **Palette** | EU-blue (#003399) as hero color, light backgrounds | Black/white monochrome | **EU-blue dominant**, warm off-white surfaces |
| **Typography** | Mixed-weight headings ("What is a **use case** manual?") | Clean sans-serif hierarchy | DM Sans body + Space Mono technical, mixed-weight headings |
| **Hero** | Dark EU-blue banners with star decorations | White/minimal | **EU-blue full-bleed banner** with star ring motifs |
| **Cards** | Illustration areas, rounded, generous padding | Sharp borders, minimal | Illustration headers, soft radius, hover lift |
| **Chips** | Pill-shaped filter categories | Minimal | **Pill-shaped** filter chips with EU-blue active state |
| **Sections** | Alternating white / warm-gray / blue | Alternating white/gray | White / warm off-white alternation |
| **Footer** | EU institutional marks, multi-column | Simple single row | Multi-column with EU flag micro-icon |
| **Header** | Blue top stripe, institutional branding | Clean minimal nav | **Blue top stripe** + star-ring EU mark |
| **Tone** | Approachable, educational, institutional | Enterprise, authoritative | **Institutional but accessible** |
| **Radius** | Soft rounded (0.75rem+) | Tight (0.5rem) | 0.75rem — softer, EUDI-leaning |

### Design Principles

1. **EU-blue is the hero color** -- Not a timid accent. Used boldly in the banner, buttons, badges, number circles, and icon backgrounds.
2. **Mixed-weight headings** -- "Explore **the use case** demos" pattern from EUDI. Light base weight (300) with bold (700) emphasis.
3. **Pill-shaped chips** -- Rounded-full filter badges with EU-blue active state. Direct EUDI pattern.
4. **Illustration-first cards** -- Featured cards have a dedicated illustration area with warm surface background, separated by a border.
5. **Warm surfaces** -- Off-white sections have a very slight warm tint (`oklch(0.975 0.003 80)`) rather than pure gray.
6. **Star decorations** -- Subtle EU flag star rings appear as background decoration in the hero and as micro-icons in the header/footer.
7. **Institutional top stripe** -- The thin EU-blue bar at the top of the header signals institutional context immediately.
8. **Generous whitespace** -- Sections use `py-20 lg:py-24` and cards have ample internal padding.

### Color Tokens

| Token | Purpose | Light Value |
|---|---|---|
| `--eu-blue` | Primary institutional color | `oklch(0.35 0.14 261)` |
| `--eu-blue-dark` | Hover/pressed blue | `oklch(0.25 0.12 261)` |
| `--eu-blue-light` | Subtle blue background tint | `oklch(0.955 0.015 261)` |
| `--eu-blue-foreground` | Text on blue backgrounds | white |
| `--eu-yellow` | EU star decoration color | `oklch(0.88 0.17 90)` |
| `--surface` | Warm off-white section background | `oklch(0.975 0.003 80)` |
| `--surface-raised` | Slightly darker warm surface | `oklch(0.96 0.005 80)` |
| `--primary` | Maps to `--eu-blue` | `oklch(0.35 0.14 261)` |
| `--border` | Borders have a faint blue tint | `oklch(0.91 0.005 261)` |

### Typography

- **Body**: DM Sans (Google Fonts, loaded in `index.html`)
- **Technical / Monospace**: Space Mono (labels, code, identifiers)
- **Headings**: DM Sans weight 400 (light) with `<strong>` at 700 for emphasis
- **Mono labels**: `mono-label` class — Space Mono, uppercase, xs, wide tracking

### CSS Utility Classes

Defined in `src/index.css` under `@layer components`:

| Class | Purpose |
|---|---|
| `.container-page` | Max-width centered container (1152px) with horizontal padding |
| `.section-alt` | Warm off-white background for alternating sections |
| `.section-eu-banner` | Full EU-blue background section |
| `.btn-eu-blue` | EU-blue primary action button with dark hover |
| `.chip` | Pill-shaped filter badge (border, rounded-full) |
| `.chip--active` | Active chip state (EU-blue fill) |
| `.card-hover` | Soft shadow + lift on hover |
| `.mono-label` | Space Mono uppercase small label |
| `.heading-mixed` | Light-weight heading for mixed bold pattern |
| `.status-dot` | Small colored circle indicator |
| `.status-dot--active` / `--pending` / `--inactive` | Status dot color variants |

### Tailwind Custom Colors

Available in any Tailwind utility (e.g., `text-eu-blue`, `bg-eu-blue-light`, `bg-surface`):

- `eu-blue`, `eu-blue-dark`, `eu-blue-light`, `eu-blue-foreground`
- `eu-yellow`
- `surface`, `surface-raised`

### Component Patterns

- **Header**: Blue top stripe + logo + EU star-ring badge + nav links
- **Hero**: Full-bleed EU-blue banner with star ring SVG decorations, mixed-weight heading, white/outline CTAs, curved bottom transition
- **Use Case Card**: Illustration/placeholder area + pill category badge + status dot + "Discover" link
- **Filter Row**: Pill-shaped `.chip` buttons with `.chip--active` for selected
- **Section Header**: `mono-label` overline + `.heading-mixed` heading with `<strong>` emphasis
- **Steps**: EU-blue numbered circles + icon in blue-light box + title + description
- **Developer Card**: Blue gradient top bar + feature grid with icon boxes
- **Footer**: Multi-column links + EU flag micro-SVG + institutional copy
