# 14 · UI Component Plan

Which UI primitives and feature components the assessment requires, which shadcn/ui pieces to install, and what is explicitly out of scope. This document is the checklist for implementation — every row ties back to a brief requirement in [01](./01-requirements-traceability.md).

**Stack:** Tailwind CSS 4 + shadcn/ui on **Base UI**. Install components with the CLI only; do not pull third-party shadcn blocks or admin kits (they are built for Radix and add surface area you do not need).

```bash
pnpm dlx shadcn@latest init --template next --base base
```

---

## Requirement → UI surface

| Brief requirement | UI the reviewer expects | Primary route / owner |
|---|---|---|
| Login / logout | Login form; header user menu with sign out | `(auth)/login`, `PortalHeader` |
| Request dashboard | Sortable table (desktop), card list (mobile), eight columns | `/requests` |
| Search & filters | Debounced search, multi-select filters, active filter chips, clear all | `FilterBar`, `SearchInput` |
| Pagination | Previous / next and bounded page numbers as real links | `Pagination` |
| Request details | Information panel + activity timeline | `/requests/[id]` |
| Status / assignee updates | Status menu on dashboard rows **and** detail page; assignee control on **detail page only** | `StatusControl`, `AssigneeControl` |
| Application states | Skeletons, two empty states, inline validation, toasts, `error.tsx`, `not-found.tsx` | Per-route + shared |
| Responsive / a11y | Filter sheet on mobile, skip link, live region, keyboard-operable controls | Layout + dashboard |
| Activity summary utility | Summary table + rejected-records disclosure | `/insights` |

**Not in scope:** create-request form, real-time notifications drawer, settings profile editor, bulk-action toolbar, admin dashboards.

---

## shadcn/ui primitives to install

Install in Phase 0 after `shadcn init`. Add more only when a phase needs them — Knip will flag unused `components/ui` exports if you install the whole catalog.

### Required (core deliverable)

| shadcn component | Used for | Requirement |
|---|---|---|
| `button` | Login submit, clear filters, conflict reload, sheet trigger | Auth, empty state, errors |
| `input` | Login fields, dashboard search | Auth, search |
| `label` | Accessible login labels | Auth, forms |
| `badge` | Status and priority labels (text + colour) | Dashboard, detail |
| `dropdown-menu` | Per-row status control; desktop filter menus if needed | Update workflow, filters |
| `popover` + `checkbox` | Multi-select filter panels (status, priority, category by slug, assignee by id) | Search & filters |
| `sheet` | Mobile filter panel (focus trap, Escape to close) | Responsive UI |
| `skeleton` | Table skeleton, detail/timeline loading | Application states |
| `sonner` | Success, error, and conflict toasts | Update workflow, validation |
| `tooltip` | Explains disabled status/assignee when user lacks permission | Auth capabilities |
| `combobox` | Assignee picker with type-to-filter | Update workflow |
| `select` | Page size (`perPage` 10 / 25 / 50 / 100) | Search & filters |
| `separator` | Visual grouping in detail panel and shell | Detail, layout |
| `avatar` | Requester / assignee initials in table and detail | Dashboard |
| `collapsible` | Rejected-records disclosure on insights page | Insights |

One-shot install after init:

```bash
pnpm dlx shadcn@latest add button input label badge dropdown-menu popover checkbox sheet skeleton sonner tooltip combobox select separator avatar collapsible
```

> **Why no shadcn `data-table` or TanStack Table?** shadcn is a UI primitive kit (buttons, menus, sheets). The optional `data-table` block wraps **TanStack Table** and encourages client-side table state — the wrong model when SQL paginates 12,000 rows. We use a semantic `<table>` + shared `request-columns.ts` instead ([02](./02-tech-stack-decisions.md#table-markup-virtualisation-and-url-state)).

### Additional polish (Phase 7)

| shadcn component | Used for | Notes |
|---|---|---|
| `scroll-area` | Long activity timeline fallback | Prefer semantic overflow; `@tanstack/react-virtual` only in assignee picker |
| `alert` | Styled inline alerts in `error.tsx` | Plain semantic markup works; `alert` is optional polish |

### Do not install

| Component / block | Why not |
|---|---|
| `data-table` block | Bundles TanStack Table + client table patterns; conflicts with server-rendered SQL pagination ([02](./02-tech-stack-decisions.md#table-markup-virtualisation-and-url-state)) |
| TanStack Table (`@tanstack/react-table`) | Not needed — column metadata lives in `request-columns.ts` |
| `form` (RHF wrapper) | No form library — `useActionState` + Zod ([02](./02-tech-stack-decisions.md#feedback-and-what-is-deliberately-absent)) |
| `sidebar`, `navigation-menu` | Simple header nav is enough for three routes |
| `dialog` / `alert-dialog` | Conflicts use toast + reload action, not a modal |
| `calendar`, `date-picker`, `chart` | No date-range filter requirement |
| `tabs` | Detail page is a single scroll; timeline is Suspense below |
| `command` | Command palette is scope creep |
| Third-party registry blocks | Radix-only registries; incompatible with Base UI choice |

---

## Custom feature components (required)

These are **your** components under `src/features/` and `src/components/`. They compose shadcn primitives; they are not installed from a registry.

### Shell (Phase 2–3)

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `SkipLink` | Server or client | native `<a>` + Tailwind | 3 |
| `PortalHeader` | Server + client island | `avatar`, `button`, `dropdown-menu` (`UserMenu` with sign out) | 3 |
| `PortalNav` | Server | `<nav>` links: `/requests`, `/insights` | 3 |
| `UserMenu` | Client | `dropdown-menu` — shows name, role, logout action | 3 |
| `ToasterHost` | Client | `sonner` `<Toaster />` in root layout | 2 |

### Auth (Phase 2)

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `LoginForm` | Client | `input`, `label`, `button`; `useActionState` | 2 |

### Dashboard (Phase 3)

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `request-columns.ts` | Shared module | Column ids, labels, sort keys, responsive visibility — **not** a UI component | 3 |
| `RequestTable` | Server | semantic `<table>` driven by `request-columns.ts`; `<caption>`, `aria-sort` | 3 |
| `RequestRow` | Server | `<tr>` / card cells; `RowStatusControl` in the status cell, link to detail | 3 / 5 |
| `PerPageSelect` | Client | `select` — URL `perPage` 10 / 25 / 50 / 100; clears `cursor` on change | 3 |
| `RequestTableSkeleton` | Server | `skeleton` rows matching real geometry | 3 |
| `SearchInput` | Client | `input`; `useDebouncedCallback` (300 ms) → URL | 3 |
| `FilterBar` | Client | `popover` + `checkbox` groups; `sheet` on mobile | 3 |
| `ActiveFilterChip` | Client | `badge` or chip styled `button` | 3 |
| `ClearFiltersButton` | Client | `button` → strip query params | 3 |
| `SortLink` | Server | `<Link>` in `<th>` | 3 |
| `Pagination` | Server | `<nav>` + `<a>` links (not client state) | 3 |
| `FacetCounts` | Server | text beside filter labels | 3 |
| `StatusBadge` | Server | `badge` + text label | 3 |
| `PriorityBadge` | Server | `badge` + text + shape cue | 3 |
| `EmptyState` | Server | two variants: no data vs no matches | 3 |
| `ResultsLiveRegion` | Client | `sr-only` `role="status"` `aria-live="polite"` | 3 |

### Request detail (Phase 4)

`RequestDetailPanel` renders: reference, subject, full description, category, priority, status, assignee, requester (name + email), created at, updated at, resolved at (when set). Phase 4 shows status and assignee as read-only badges/names; Phase 5 replaces them with `StatusControl` and `AssigneeControl`. Activity timeline is a sibling Suspense boundary below.

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `RequestDetailPanel` | Server | styled `<section>` + `separator`; read-only status/assignee in Phase 4 | 4 |
| `RequestDetailSkeleton` | Server | `skeleton` | 4 |
| `ActivityTimeline` | Server | ordered list `<ol>`; own Suspense boundary | 4 |
| `ActivityEntry` | Server | list item with `<time datetime>` | 4 |
| Segment `not-found.tsx` | Server | semantic markup + `Link` | 4 |
| Segment `error.tsx` | Client | `button` + `Link`; `role="alert"` | 4 |
| Segment `loading.tsx` | Server | skeleton matching detail layout | 4 |

### Update workflow (Phase 5)

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `StatusControl` | Client | `dropdown-menu` + `badge`; `useOptimistic` — **dashboard row + detail panel** | 5 |
| `AssigneeControl` | Client | `combobox` + `@tanstack/react-virtual` — **detail panel only** | 5 |
| `RowStatusControl` | Client | thin wrapper mounting `StatusControl` in one dashboard table cell | 5 |

### Insights (Phase 6)

| Component | Type | shadcn / markup | Phase |
|---|---|---|---|
| `InsightsSummaryTable` | Server | semantic `<table>` or shadcn `table` wrapper | 6 |
| `RejectedRecordsDisclosure` | Server / client | `collapsible` | 6 |

### Route-level files (not components, but required UI)

| File | Phase |
|---|---|
| `app/global-error.tsx` | 7 |
| `app/not-found.tsx` | 7 |
| `app/(portal)/requests/loading.tsx` | 3 |
| `app/(portal)/requests/error.tsx` | 3 |

---

## Layout blocks (not from shadcn)

| Block | Implementation |
|---|---|
| **App shell** | `(portal)/layout.tsx` — header, nav, `<main id="main">`, filter bar slot |
| **Auth shell** | `(auth)/layout.tsx` — centred card layout |
| **Dashboard table ↔ cards** | One `<table>` DOM; CSS `@media` reflow ([08](./08-ui-states-and-accessibility.md#responsive-strategy)) |
| **Detail two-column → stack** | CSS grid / flex; no JS breakpoint hook |

---

## Phase checklist (roadmap integration)

### Phase 0

- [ ] `shadcn init --base base`
- [ ] Install **required** primitives (command above)
- [ ] `ToasterHost` in root layout
- [ ] Shared `cn()` utility (shadcn init provides `lib/utils.ts`)

### Phase 2

- [x] `LoginForm` — `input`, `label`, `button`
- [x] `PortalHeader` user menu skeleton (logout can land here or Phase 3)

### Phase 3

- [ ] All dashboard feature components in the table above
- [ ] `sheet` wired for mobile filters
- [ ] `popover` + `checkbox` for desktop multi-select filters
- [ ] `EmptyState` both variants
- [ ] `RequestTableSkeleton` in `loading.tsx` and Suspense fallback

### Phase 4

- [x] `RequestDetailPanel`, `ActivityTimeline`, segment error/loading/not-found

### Phase 5

- [x] `StatusControl`, `AssigneeControl`, toast messages per `AppError` code
- [x] `tooltip` on disabled controls when `canEdit` is false

### Phase 6

- [ ] `InsightsSummaryTable` and `RejectedRecordsDisclosure` (`collapsible`)

### Phase 7

- [ ] Root `not-found` / `global-error`
- [ ] Keyboard audit on every component in the keyboard table ([08](./08-ui-states-and-accessibility.md#keyboard))
- [ ] `pnpm knip` — no orphaned `components/ui` files

---

## Client JavaScript budget

Only these mount as Client Components (aligns with [05](./05-rendering-and-caching.md) and [01 §7](./01-requirements-traceability.md#7-performance--scale)):

| Client island | Why |
|---|---|
| `LoginForm` | `useActionState` |
| `SearchInput` | `useDebouncedCallback` + `useTransition` |
| `FilterBar` / chips / sheet trigger / `PerPageSelect` | interactive filters |
| `StatusControl` / `AssigneeControl` / `UserMenu` | `useOptimistic` + Server Actions |
| `ResultsLiveRegion` | announces filter result changes |
| `ToasterHost` | sonner |
| `error.tsx` boundaries | `retry()` |

Everything else — table body, rows, badges in cells, pagination links, detail panel, activity list — stays server-rendered.

---

## Verification

| Check | Proves |
|---|---|
| `jest-axe` on `LoginForm`, `StatusControl`, `AssigneeControl`, `EmptyState` | Component a11y |
| Playwright `responsive.spec.ts` | Sheet at 375px, table at 1280px |
| Playwright keyboard journey | Every control in [08 keyboard table](./08-ui-states-and-accessibility.md#keyboard) |
| `pnpm knip` | No unused shadcn primitives after each phase |
