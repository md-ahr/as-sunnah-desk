# 17 · UI Design Guidelines

Visual and interaction standards for **As-Sunnah Desk** (the Service Request Management Portal).
This document is the single source of truth for colour, typography, spacing,
elevation, and component behaviour. It complements — and does not replace —
[08 · UI states and accessibility](./08-ui-states-and-accessibility.md) and
[14 · UI component plan](./14-ui-component-plan.md).

**Stack:** Tailwind CSS 4, shadcn/ui on Base UI, Lucide icons.

---

## 1 · Product context and constraints

### Audience and tone

> **Decision — enterprise / B2B internal tool, not consumer marketing.**

| Dimension | Choice | Rationale |
|---|---|---|
| Audience | Staff and stakeholders managing service requests | Data density and scan speed matter more than brand expression |
| Tone | Calm, professional, trustworthy | Users spend long sessions in tables and detail views |
| Visual priority | Clarity over decoration | Status, assignee, and priority must be readable at a glance |
| Brand expression | Restrained | Foundation identity is conveyed through quality and care, not loud colour |

**Rejected:** consumer/B2C patterns (hero sections, expressive gradients, oversized
whitespace, playful illustration-heavy empty states). They fight the dashboard's
job: move through hundreds of rows quickly without fatigue.

### Platform

| Platform | Support | Notes |
|---|---|---|
| Desktop | Primary (≥ 1024px) | Full table, all columns, mouse precision |
| Tablet | Supported (640–1023px) | Same table; lower-priority columns hidden via CSS |
| Mobile | Supported (< 640px) | Card reflow; filters in sheet; touch-first targets |

This is a **responsive web application**, not a native iOS/Android app. Follow
web accessibility standards; borrow mobile **touch-target** minimums from platform
guidelines where they improve usability on small screens.

### Accessibility target

> **Decision — WCAG 2.2 Level AA as the minimum bar.**

| Requirement | Target | Verification |
|---|---|---|
| Body text contrast | ≥ 4.5 : 1 | Manual audit against token palette |
| Large text (≥ 18px / 14px bold) | ≥ 3 : 1 | Headings, badge labels |
| UI component contrast | ≥ 3 : 1 | Borders, icons, focus rings |
| Colour as sole indicator | Never | Text labels on all status/priority badges; dot count on priority |
| Focus visibility | 2px ring, ≥ 3 : 1 against adjacent colours | `:focus-visible` on every interactive control |
| Motion | Respect `prefers-reduced-motion` | See [08](./08-ui-states-and-accessibility.md#motion) |

**Rejected:** relying on saturated red/green alone for status; removing focus
outlines; pure white `#FFFFFF` page backgrounds (glare on long sessions).

### Eye-comfort constraints

These are product requirements, not optional polish:

- **No gradients** on surfaces, buttons, or headers.
- **No high-chroma / neon accents.** Semantic colours are desaturated tints.
- **Off-white backgrounds** and **soft charcoal text** instead of pure black on
  pure white.
- **Light badge fills + dark text** — never full-saturation pill backgrounds.

---

## 2 · Spatial system

### Base unit

> **Decision — 4px base grid, composed into an 8px rhythm.**

All spacing, sizing, and gaps use multiples of **4px**. Prefer **8px steps**
for layout; use 4px only for tight internal alignment (icon + label, input
padding).

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

Map to Tailwind: `1=4px`, `2=8px`, `3=12px`, `4=16px`, `6=24px`, `8=32px`,
`12=48px`, `16=64px`, `24=96px`, `32=128px`.

### Container and grid

| Context | Max width | Horizontal padding |
|---|---|---|
| Portal shell (`/requests`, `/insights`) | `max-w-7xl` (1280px) | `px-4` mobile, `px-6` tablet, `px-8` desktop |
| Auth card (`/login`) | `max-w-sm` (384px) | Centred; `p-6` inside card |
| Detail panel | Fluid within shell | Two-column grid ≥ 1024px; single column below |

**Column model (desktop):** implicit 12-column grid via CSS Grid / Flexbox.
The dashboard table spans full content width; the detail page uses
`grid-cols-1 lg:grid-cols-[1fr_320px]` (main + sidebar metadata) or equivalent.

Do not introduce a JavaScript breakpoint hook — layout switches are CSS-only
([08 · Responsive strategy](./08-ui-states-and-accessibility.md#responsive-strategy)).

### Spacing hierarchy

| Level | Range | Use |
|---|---|---|
| **Micro** | 4–12px (`gap-1` – `gap-3`) | Icon ↔ label, label ↔ input, badge internal padding |
| **Component** | 16–24px (`gap-4` – `gap-6`) | Card padding, form field stack, filter bar gaps, table cell padding |
| **Section** | 48–96px (`py-12` – `py-24`) | Page header ↔ content, empty-state vertical padding, auth card margin |

### Standard component spacing

| Element | Padding / gap |
|---|---|
| Table cell | `px-4 py-3` (16×12) |
| Card / panel | `p-6` (24px) |
| Filter bar | `gap-3` between controls; `py-4` vertical |
| Button (default) | `px-4 py-2` (height ≈ 36px desktop) |
| Button (mobile touch) | `min-h-11 min-w-11` (44px) where tap is primary input |
| Input | `h-10 px-3` (40px height, 12px horizontal) |
| Stack of form fields | `space-y-4` (16px) |

### Breakpoints

Align with [08](./08-ui-states-and-accessibility.md#responsive-strategy):

| Token | Width | Layout |
|---|---|---|
| `sm` | 640px | Table visible; some columns hidden |
| `lg` | 1024px | Full table; detail two-column |
| `xl` | 1280px | Comfortable max-width container |

Test at **375px** (mobile), **768px** (tablet), and **1280px** (desktop) —
these are the Playwright targets in [09](./09-testing-strategy.md).

---

## 3 · Design tokens and visual rules

### A · Colour architecture

#### The 60-30-10 rule

Apply colour by **area**, not by element count:

| Share | Role | Tokens | Where it appears |
|---|---|---|---|
| **~60%** | Dominant neutrals | `background`, `foreground`, `muted` | Page canvas, body text, table rows |
| **~30%** | Supporting neutrals | `card`, `border`, `secondary`, `accent` | Cards, inputs, borders, hover rows, filter bar |
| **~10%** | Accent + feedback | `primary`, `destructive`, status/priority tints | Primary buttons, active nav, links, badges, toasts, errors |

The interface should read as **mostly neutral**. If more than ~10% of a screen
feels "colourful", reduce saturation or move colour to badges and links only.

#### Semantic colour roles

| Role | Purpose | Token(s) |
|---|---|---|
| **Primary / brand** | Primary CTAs, active nav, links, focus ring | `--primary`, `--primary-foreground` |
| **Neutral scale** | Backgrounds, borders, body text | `--background` → `--foreground`, `--muted`, `--border` |
| **Surface / elevation** | Layered UI | `--background` (base), `--card` (raised), `--popover` (floating) |
| **Feedback** | Operational meaning | `--destructive`; status/priority badge tints (see below) |
| **Secondary** | Low-emphasis actions | `--secondary`, `--secondary-foreground` |

#### Core palette (light mode)

HSL values for shadcn CSS variables. No gradients; flat fills only.

| Token | HSL | Hex (approx.) | Notes |
|---|---|---|---|
| `--background` | `40 20% 98%` | `#FAFAF8` | Warm off-white canvas (60%) |
| `--foreground` | `210 10% 20%` | `#2E3338` | Soft charcoal, not `#000` |
| `--card` | `0 0% 100%` | `#FFFFFF` | Raised panels |
| `--card-foreground` | `210 10% 20%` | `#2E3338` | |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Dropdowns, filter popovers |
| `--popover-foreground` | `210 10% 20%` | `#2E3338` | |
| `--primary` | `185 18% 32%` | `#3D5A5C` | Dusty teal-slate (10% accent) |
| `--primary-foreground` | `40 20% 98%` | `#FAFAF8` | |
| `--secondary` | `40 12% 93%` | `#EFEDE8` | Secondary buttons |
| `--secondary-foreground` | `210 10% 25%` | `#3A3F44` | |
| `--muted` | `40 15% 95%` | `#F4F3F0` | Table zebra, filter track |
| `--muted-foreground` | `215 10% 45%` | `#6B7280` | Timestamps, helper text |
| `--accent` | `40 14% 94%` | `#F1F0EC` | Row hover, subtle highlight |
| `--accent-foreground` | `210 10% 25%` | `#3A3F44` | |
| `--destructive` | `0 35% 42%` | `#8F4545` | Errors — dusty rose, not bright red |
| `--destructive-foreground` | `40 20% 98%` | `#FAFAF8` | |
| `--border` | `40 10% 88%` | `#E5E3DE` | Dividers, input borders |
| `--input` | `40 10% 88%` | `#E5E3DE` | |
| `--ring` | `185 18% 32%` | `#3D5A5C` | Focus ring colour |

#### Dark mode (optional, soft)

Default to **light mode** for this portal. If dark mode is added, use warm dark
greys — not `#000`. Prefer a user toggle over `prefers-color-scheme` alone.

| Token | HSL |
|---|---|
| `--background` | `220 10% 11%` |
| `--foreground` | `40 10% 90%` |
| `--card` | `220 10% 14%` |
| `--border` | `220 8% 22%` |
| `--primary` | `185 22% 55%` |

#### Status badge colours

Pattern: **tinted background (92–94% lightness) + darker text (28–38% lightness)**.
Always include the status **text label** — colour alone is insufficient
([08](./08-ui-states-and-accessibility.md#colour-is-never-the-only-signal)).

| Status | Background | Foreground |
|---|---|---|
| `new` | `hsl(215 20% 94%)` | `hsl(215 25% 35%)` |
| `in_review` | `hsl(200 18% 93%)` | `hsl(200 22% 34%)` |
| `in_progress` | `hsl(185 20% 92%)` | `hsl(185 25% 30%)` |
| `on_hold` | `hsl(38 30% 92%)` | `hsl(38 35% 32%)` |
| `resolved` | `hsl(150 18% 92%)` | `hsl(150 25% 28%)` |
| `rejected` | `hsl(0 25% 94%)` | `hsl(0 35% 38%)` |
| `closed` | `hsl(40 8% 92%)` | `hsl(210 8% 40%)` |

#### Priority badge colours

Same tint pattern. Add **filled-dot count** (●●●○) so priority is identifiable
in greyscale and by users with colour-vision deficiency.

| Priority | Background | Foreground | Dots |
|---|---|---|---|
| `low` | `hsl(40 8% 93%)` | `hsl(210 8% 40%)` | ●○○○ |
| `medium` | `hsl(200 16% 93%)` | `hsl(200 20% 34%)` | ●●○○ |
| `high` | `hsl(38 28% 92%)` | `hsl(38 32% 32%)` | ●●●○ |
| `urgent` | `hsl(15 25% 93%)` | `hsl(15 30% 38%)` | ●●●● |

#### Feedback colours (non-badge)

| State | Colour | Usage |
|---|---|---|
| Success | `hsl(150 25% 28%)` on `hsl(150 18% 92%)` | Toast border/icon; durable UI change is primary feedback |
| Warning | `hsl(38 35% 32%)` on `hsl(38 30% 92%)` | Conflict toast, non-blocking alerts |
| Error | `--destructive` | Validation messages, `role="alert"` |
| Info | `hsl(200 22% 34%)` on `hsl(200 18% 93%)` | Neutral informational callouts |

### B · Typography

#### Typeface families

> **Decision — one sans-serif for UI, one monospace for reference IDs.**

| Role | Family | Fallback | Loaded via |
|---|---|---|---|
| UI / body | **Source Sans 3** | `system-ui, sans-serif` | `next/font/google` |
| Monospace | **IBM Plex Mono** | `ui-monospace, monospace` | `next/font/google` |

**Alternative already in repo:** Geist Sans + Geist Mono — acceptable if fonts
are not changed before submission. Source Sans 3 is preferred for 14px table
density.

**Rejected:** display serifs, thin geometric faces, more than two families.

#### Weights

Use **three weights only**:

| Weight | Token | Use |
|---|---|---|
| 400 | `font-normal` | Body, table cells, descriptions |
| 500 | `font-medium` | Labels, badges, column headers, buttons |
| 600 | `font-semibold` | Page titles, empty-state headings |

Avoid `font-bold` (700) except where a heading truly needs extra emphasis.

#### Type scale

Base size for dashboard UI is **14px** (`text-sm`). Body copy on marketing-style
pages would be 16px; this portal is data-dense.

| Role | Size | Line height | Weight | Tailwind |
|---|---|---|---|---|
| Display (unused on portal) | 36–56px | 1.1–1.2 | 600 | — |
| Page title | 24px | 1.25 | 600 | `text-2xl font-semibold tracking-tight` |
| Section heading | 18px | 1.3 | 500 | `text-lg font-medium` |
| Subsection / card title | 16px | 1.4 | 500 | `text-base font-medium` |
| Body / table default | 14px | 1.5 | 400 | `text-sm` |
| Label / UI chrome | 14px | 1.4 | 500 | `text-sm font-medium` |
| Caption / timestamp | 12px | 1.4 | 400 | `text-xs text-muted-foreground` |
| Reference ID | 14px | 1.4 | 400 | `text-sm font-mono` |

#### Typography rules

1. **Minimum readable size:** 12px for captions only; never for primary actions.
2. **Tabular numbers:** apply `tabular-nums` to dates, counts, pagination, and
   the insights summary table.
3. **Truncation:** long subjects truncate with `truncate` + `title` attribute for
   full text on hover/focus ([01](./01-requirements-traceability.md)).
4. **No all-caps labels** except two-letter avatar initials.
5. **Antialiasing:** `antialiased` on `<html>` (already in layout).

### C · Visual identity and detail

#### Border radius

> **Decision — subtle rounding (8px base).**

| Token | Value | Applied to |
|---|---|---|
| `--radius` | `0.5rem` (8px) | Buttons, inputs, cards, badges |
| `rounded-sm` | 4px | Chips, small badges |
| `rounded-md` | 8px | Default — cards, inputs |
| `rounded-lg` | 12px | Modals, sheets only |
| `rounded-full` | 9999px | Avatars only |

**Rejected:** sharp 0px (too harsh for long sessions), pill-shaped buttons
(reads consumer), mixed radii across components.

#### Elevation and shadows

Prefer **borders** over shadows for cards and table containers. Use shadow only
when an element floats above the page.

| Level | Name | CSS | Use |
|---|---|---|---|
| 0 | Flat | `border border-border` | Table wrapper, cards on canvas |
| 1 | Low | `shadow-sm` | Login card, insights panel |
| 2 | Medium | `shadow-md` | Dropdown menus, popovers, combobox |
| 3 | High | `shadow-lg` | Sheet (mobile filters), modal overlays |

**No gradients** on any elevation level. Overlay scrim: `bg-black/40` flat.

#### Iconography

| Rule | Value |
|---|---|
| Library | **Lucide** (already in dependency budget) |
| Default size | 16px (`size-4`) inline; 20px (`size-5`) in buttons |
| Stroke width | Default Lucide 2px — do not mix filled and stroked sets |
| Colour | `currentColor` — inherits `foreground` or `muted-foreground` |
| Decorative icons | `aria-hidden="true"` |
| Icon-only buttons | Require `aria-label` |

#### Borders and dividers

- Default border: `border-border` (1px solid).
- Section splits: `<Separator />` or `border-t border-border`.
- Table: horizontal rules only; avoid vertical grid lines (cleaner scan).

---

## 4 · Component states and edge cases

Behavioural specs live in [08](./08-ui-states-and-accessibility.md). This section
maps **visual** treatment to each state.

### Interactive states

Every interactive component implements all applicable states:

| State | Visual treatment |
|---|---|
| **Default** | Base token colours |
| **Hover** | `bg-accent` on rows/buttons; `underline` on text links |
| **Focus** | `ring-2 ring-ring ring-offset-2 ring-offset-background` via `:focus-visible` |
| **Active / pressed** | `bg-accent` slightly darker or `scale-[0.98]` on primary button only |
| **Disabled** | `opacity-50`, `pointer-events-none`; explanatory `tooltip` when permission-denied |
| **Pending** | `opacity-60` on affected region + `aria-busy="true"` ([08](./08-ui-states-and-accessibility.md#loading-two-different-situations)) |

### Data states

| State | Visual treatment |
|---|---|
| **Empty (no data)** | Centred `py-16`; `text-lg font-medium` heading; muted helper text; no CTA to clear filters |
| **Empty (no matches)** | Same layout; includes `ClearFiltersButton` |
| **Loading (first paint)** | `Skeleton` matching real row geometry — no layout shift |
| **Loading (refining)** | Previous data stays visible at `opacity-60`; no skeleton swap |
| **Partial data** | Detail panel renders known fields; timeline Suspense shows its own skeleton |
| **Error** | `role="alert"`; destructive text; retry button |
| **Not found** | Neutral copy; link back to dashboard |
| **Overflow text** | `truncate` + `title`; description on detail page wraps (`whitespace-pre-wrap`) |

### Key component specs

#### Buttons

| Variant | Background | Text | Use |
|---|---|---|---|
| Primary | `primary` | `primary-foreground` | Login submit, clear filters (empty state) |
| Secondary | `secondary` | `secondary-foreground` | Cancel, low-emphasis actions |
| Ghost | transparent | `foreground` | Toolbar icons, table actions |
| Destructive | `destructive` | `destructive-foreground` | Irreversible actions only (rare in this app) |

#### Table rows

- Default: transparent background.
- Hover: `bg-accent/50`.
- Zebra (optional): even rows `bg-muted/30` — use one or the other, not both.
- Selected/open: not required in v1.

#### Badges

- Shape: `rounded-sm`, `px-2 py-0.5`, `text-xs font-medium`.
- Always include text label.
- Priority badges include dot indicator before label.

#### Toasts (sonner)

- Success: subtle left border in sage green; message text only — no icon-only toast.
- Error / conflict: warning border colour; include actionable "Reload" when applicable.
- Position: `bottom-right` desktop; `bottom-center` mobile.

---

## 5 · Component composition (predefined blocks)

> **Decision — every page and feature UI is assembled from predefined blocks.
> Routes compose; they do not invent markup.**

Pages (`app/**/page.tsx`) are thin orchestration layers: fetch data, pass props,
wire Suspense boundaries. All visual and interactive UI lives in named
components from lower layers. One-off JSX or ad-hoc Tailwind in a route file is
not allowed except for trivial layout wrappers (`<div className="space-y-6">`).

**Rejected:** building screens inline in `page.tsx`; copying shadcn markup into
feature files instead of importing from `components/ui/`; third-party shadcn
registry blocks or admin kits ([14](./14-ui-component-plan.md#do-not-install));
duplicating `StatusBadge` styling in a second component.

### Component hierarchy

Build from the bottom up. Each layer may only import from layers below it.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 5 · Routes          app/(portal)/requests/page.tsx   │
│            Compose layouts + feature components only        │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 · Layout blocks   (portal)/layout, (auth)/layout   │
│            Shell, nav slots, page chrome                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 · Feature         features/*/components/         │
│            RequestTable, FilterBar, LoginForm, …            │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 · Shared          components/ (non-ui)             │
│            SkipLink, PortalHeader, EmptyState patterns      │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 · Primitives      components/ui/  (shadcn)         │
│            button, input, badge, sheet, …                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 0 · Tokens          globals.css, badge-variants.ts   │
│            CSS variables, spacing, colour maps              │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Location | Responsibility | May import |
|---|---|---|---|
| **0 · Tokens** | `globals.css`, `badge-variants.ts` | Design tokens, enum → colour maps | Nothing |
| **1 · Primitives** | `components/ui/*` | Accessible controls; shadcn CLI only | Tokens, `cn()` |
| **2 · Shared shell** | `components/*` | Cross-feature layout (header, skip link) | Layer 1 |
| **3 · Feature** | `features/*/components/*` | Domain UI (table, filters, timeline) | Layers 1–2 |
| **4 · Layout** | `app/(portal)/layout.tsx`, etc. | Route-group chrome, slots | Layers 2–3 |
| **5 · Route** | `app/**/page.tsx` | Data fetch, composition, metadata | Layers 3–4 |

Dependency direction matches [03 · System architecture](./03-system-architecture.md):
`app/` imports `features/` and `components/`; primitives never import features.

### Predefined block inventory

Use the blocks defined in [14 · UI component plan](./14-ui-component-plan.md).
Do not introduce parallel components with the same job.

#### Primitives (`components/ui/`)

Installed via shadcn CLI only — see the required list in
[14 · shadcn primitives](./14-ui-component-plan.md#required-core-deliverable).
Customise tokens in `globals.css`; do not fork primitive behaviour unless a bug
requires it.

| Primitive | Used by |
|---|---|
| `button`, `input`, `label` | `LoginForm`, actions, filters |
| `badge` | `StatusBadge`, `PriorityBadge`, filter chips |
| `dropdown-menu`, `popover`, `checkbox`, `sheet` | `FilterBar`, `StatusControl` |
| `skeleton` | All `loading.tsx` and Suspense fallbacks |
| `sonner` | `ToasterHost` — global feedback |
| `select`, `combobox`, `tooltip`, `avatar`, `separator`, `collapsible` | Per component plan |

#### Shared shell blocks

| Block | Owner | Role |
|---|---|---|
| `SkipLink` | `components/` | First focusable element → `#main` |
| `PortalHeader` + `PortalNav` | `components/` | Brand, nav links, user menu slot |
| `UserMenu` | `components/` or `features/auth/` | Client island: avatar, logout |
| `ToasterHost` | `components/` | Root layout; single toast mount |

#### Feature blocks (by route)

| Route | Compose from |
|---|---|
| `/login` | `(auth)/layout` → `LoginForm` |
| `/requests` | `(portal)/layout` → `SearchInput` + `FilterBar` + `RequestTable` / `EmptyState` + `Pagination` + `ResultsLiveRegion` |
| `/requests/[id]` | `(portal)/layout` → `RequestDetailPanel` + `ActivityTimeline` (Suspense) |
| `/insights` | `(portal)/layout` → `InsightsSummaryTable` + `RejectedRecordsDisclosure` |

#### Layout blocks (not shadcn)

| Layout | Structure |
|---|---|
| **Root** | `html` / `body`, fonts, `ToasterHost` |
| **Auth** | Centred card (`max-w-sm`), `card` surface, `p-6` |
| **Portal** | `PortalHeader`, `PortalNav`, `<main id="main">` with `max-w-7xl` container |

### Composition rules

#### Pages compose, components implement

```tsx
// app/(portal)/requests/page.tsx — correct shape
export default async function RequestsPage({ searchParams }: PageProps) {
  const filters = parseSearchParams(await searchParams)
  const data = await getRequests(filters)

  return (
    <div className="space-y-6">
      <PageHeader title="Service requests" count={data.total} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput defaultValue={filters.q} />
        <FilterBar filters={filters} facets={data.facets} />
      </div>
      {data.rows.length === 0
        ? <EmptyState hasActiveFilters={filters.hasActive} />
        : <RequestTable rows={data.rows} sort={filters.sort} />}
      <Pagination meta={data.pagination} />
      <ResultsLiveRegion total={data.total} />
    </div>
  )
}
```

The page does **not** contain `<table>`, `<input>`, or badge markup. Those live
in feature components.

#### One component, one job

| Component | Single responsibility |
|---|---|
| `StatusBadge` | Read-only status display |
| `StatusControl` | Interactive status change (wraps badge + menu) |
| `RequestTable` | Table structure + caption + header row |
| `RequestRow` | One row's cells |
| `EmptyState` | Empty UI only — no data fetching |

Do not merge `FilterBar` and `SearchInput` into a god component. Do not put
repository calls inside `RequestTable`.

#### Extend before duplicate

Before creating a new component, check:

1. Can an existing primitive (`button` variant, `badge`) cover it?
2. Can an existing feature component accept a new prop?
3. Does the UI component plan already name the block?

If yes, extend. If no, add the component to `features/*/components/` **and**
update [14](./14-ui-component-plan.md).

#### Styling lives in components, not routes

| Allowed in `page.tsx` | Not allowed in `page.tsx` |
|---|---|
| `space-y-*`, `gap-*`, `max-w-*` layout wrappers | Raw `button`, `input`, `table` markup |
| Passing server-fetched props | Inline `className` on domain elements |
| `<Suspense>` boundaries | Hard-coded colours or `hsl(...)` values |
| `metadata` export | Copy-pasted shadcn snippets |

Use `cn()` and tokens inside components. Status colours come from
`badge-variants.ts`, not per-file Tailwind literals.

#### Server vs client boundaries

Match [14 · Client JavaScript budget](./14-ui-component-plan.md#client-javascript-budget):

- **Server Components** by default: tables, rows, badges, pagination links,
  detail panel, timeline, empty states, skeletons.
- **`'use client'`** only when needed: debounced search, filters, optimistic
  controls, user menu, toasts, `error.tsx`.

Never mark a whole page `'use client'` to avoid lifting interactivity into a
leaf component.

### When to add a new block

| Situation | Action |
|---|---|
| New shadcn primitive needed for a planned feature | `pnpm dlx shadcn@latest add <name>`; document in 14 |
| Same UI pattern used 3+ times | Extract to `components/` or `features/` |
| One-off layout spacing on a single page | Keep in `page.tsx` wrapper only |
| Third-party "dashboard block" from a registry | **Do not install** — incompatible with Base UI |
| Custom primitive behaviour (new focus trap) | Fix upstream in `components/ui/` once, reuse everywhere |

### Visual consistency across blocks

All blocks must share:

- The same **spacing scale** (section 2)
- The same **tokens** (section 3)
- The same **interactive states** (section 4)
- The same **skeleton geometry** as the component they replace

When a block is added, ship its **loading**, **empty**, and **error** variants
in the same phase — not as a follow-up.

### Composition checklist

| Check | Pass criteria |
|---|---|
| Page imports only layout + feature components | No `components/ui/*` in `page.tsx` except via features |
| No duplicate badge/table/filter markup | Grep for repeated class strings |
| Primitives from CLI only | Every file in `components/ui/` traceable to shadcn add |
| Feature component named in doc 14 | Or doc 14 updated in the same PR |
| Client boundary minimal | `'use client'` only on interactive leaves |
| `pnpm knip` clean | No orphaned `components/ui` exports |

---

## 6 · Implementation reference

### CSS variables (`globals.css`)

```css
:root {
  --background: 40 20% 98%;
  --foreground: 210 10% 20%;
  --card: 0 0% 100%;
  --card-foreground: 210 10% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 210 10% 20%;
  --primary: 185 18% 32%;
  --primary-foreground: 40 20% 98%;
  --secondary: 40 12% 93%;
  --secondary-foreground: 210 10% 25%;
  --muted: 40 15% 95%;
  --muted-foreground: 215 10% 45%;
  --accent: 40 14% 94%;
  --accent-foreground: 210 10% 25%;
  --destructive: 0 35% 42%;
  --destructive-foreground: 40 20% 98%;
  --border: 40 10% 88%;
  --input: 40 10% 88%;
  --ring: 185 18% 32%;
  --radius: 0.5rem;
}
```

### Font loading (`app/layout.tsx`)

```tsx
import { Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'

const sans = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})
```

### Badge variant map (feature layer)

Centralise status/priority colours in one module — do not scatter hex values
across components:

```
src/features/requests/badge-variants.ts
```

Export maps from `RequestStatus` / `RequestPriority` → Tailwind class strings
for background and foreground. Component tests assert every enum value has a
variant ([09](./09-testing-strategy.md)).

---

## 7 · Checklist before shipping UI

| Check | Method |
|---|---|
| 60-30-10 balance | Screenshot review — neutrals dominate |
| No gradients | Grep / visual inspection |
| AA contrast on all text and badges | Manual token audit |
| Focus visible on every control | Keyboard-only Playwright pass |
| Touch targets ≥ 44px on mobile | Inspect filter sheet, pagination, row actions |
| Status/priority never colour-only | Badge component always renders label + dots |
| Spacing uses 4/8px scale | No arbitrary `p-[13px]` values |
| Skeleton matches real geometry | Compare `loading.tsx` to populated table |
| `prefers-reduced-motion` respected | Toggle in DevTools |
| Icons have labels where icon-only | `aria-label` audit |
| Pages built from predefined blocks | No raw primitives in `page.tsx`; feature components only |
| No duplicate UI patterns | Shared components before copy-paste |

---

## Related documents

| Topic | Document |
|---|---|
| Component inventory and shadcn list | [14 · UI component plan](./14-ui-component-plan.md) |
| Loading, empty, error, a11y behaviour | [08 · UI states and accessibility](./08-ui-states-and-accessibility.md) |
| Status enum and state machine | [04 · Data model](./04-data-model-and-scale.md) |
| Responsive breakpoints and table ↔ card | [08 · Responsive strategy](./08-ui-states-and-accessibility.md#responsive-strategy) |
| Stack (Tailwind 4, shadcn, Lucide) | [02 · Tech stack](./02-tech-stack-decisions.md) |
| Block inventory and phase checklist | [14 · UI component plan](./14-ui-component-plan.md) |
| Folder structure and import rules | [03 · System architecture](./03-system-architecture.md) |
