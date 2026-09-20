# 01 · Requirements Traceability

Each row maps a requirement from the assessment brief to the concrete mechanism that satisfies it, the file that owns it, and the test that proves it. The purpose is to make review mechanical: a reviewer should not have to hunt for where a requirement was addressed.

## Feature requirements

### 1. Authentication & Access

> *Provide a simple login/logout flow and protect application pages and relevant API operations from unauthenticated access.*

| Aspect | Mechanism | Owner |
|---|---|---|
| Login form | Server Action + `useActionState`, Zod-validated, errors returned as values not thrown | `features/auth/actions/login.ts` |
| Session | Encrypted `httpOnly` cookie via `iron-session`, 7-day sliding expiry | `server/auth/session.ts` |
| Logout | Server Action that deletes the cookie and redirects | `features/auth/actions/logout.ts` |
| Page protection | Data Access Layer `requireUser()` called by every read; `proxy.ts` does a cheap optimistic cookie check to redirect early | `server/auth/dal.ts`, `src/proxy.ts` |
| API/action protection | Every Server Action and Route Handler re-verifies the session itself. Page-level auth does **not** extend to Server Actions | `server/auth/dal.ts` |
| Brute-force resistance | In-memory sliding-window limiter keyed on IP + email | `server/auth/rate-limit.ts` |

Detail: [06 · Auth and security](./06-auth-and-security.md). The layering matters — `proxy.ts` is a redirect convenience, never the security boundary.

### 2. Request Dashboard

> *Display service requests with ID, subject/title, requester, category, priority, status, assignee and last updated time.*

A Server Component renders the table body. Each row is server-rendered markup; the only per-row client island is `RowStatusControl` (Phase 5), a small dropdown mounted inside the row. Client JS scales with page size (`perPage` 10–100), but the table itself is never a client-rendered data grid.

| Column | Source | Notes |
|---|---|---|
| ID | `service_requests.reference` | Human-readable `SR-2026-000142`, not the surrogate key |
| Subject | `service_requests.subject` | Truncated with a `title` attribute and accessible full text |
| Requester | joined `users` | Name + email, avatar initials |
| Category | joined `categories` | Cached reference data |
| Priority | `service_requests.priority` | Badge with text label, never colour alone |
| Status | `service_requests.status` | Badge + inline status control |
| Assignee | joined `users` | "Unassigned" is a first-class, filterable value |
| Last updated | `service_requests.updated_at` | `<time>` element, relative label, absolute value in `title` |

Detail: [04 · Data model](./04-data-model-and-scale.md), [08 · UI states](./08-ui-states-and-accessibility.md), [14 · UI component plan](./14-ui-component-plan.md).

### 3. Search, Filter & Navigation

> *Debounced search, multiple filters, sorting and pagination. The URL should preserve meaningful search/filter state.*

The URL is the single source of truth. There is no client-side mirror of filter state, which removes an entire category of desynchronisation bugs and makes every view shareable and back-button-correct.

| Aspect | Mechanism |
|---|---|
| Search | `useDebouncedCallback` (300 ms) in `SearchInput`, then `router.replace` inside `useTransition` so the URL updates without a scroll jump or history spam |
| Filters | Multi-select for status, priority, category (by **slug**, e.g. `?category=it-support`), assignee (by user id). Repeated query keys (`?status=new&status=on_hold`) |
| Sorting | Whitelisted `sort` enum mapped server-side to an indexed column pair. Never a raw column name from the URL |
| Pagination | Keyset (cursor) pagination as the primary mechanism, with a bounded page-number mode. See [04](./04-data-model-and-scale.md#pagination) for why offset alone is wrong here |
| Parsing | One Zod schema is the contract for the URL. Invalid values fall back to defaults rather than erroring |

Detail: [04 · Data model](./04-data-model-and-scale.md), [07 · Client state](./07-mutations-and-client-state.md#url-as-state).

### 4. Request Details

> *Dynamic details page using Next.js routing, including request information and activity/history. Direct URL access and refresh must work correctly.*

`app/(portal)/requests/[id]/page.tsx` is a Server Component. The dynamic segment is named `id` in the file tree but holds the human **reference** (`SR-2026-000142`), not the surrogate UUID — so URLs are readable and match what users see in the dashboard. The repository resolves by `reference`. Because the page is rendered on the server from the URL alone, direct access and refresh work by construction. An unknown or unauthorised reference calls `notFound()`, which renders the colocated `not-found.tsx`.

The activity history is a separate Suspense boundary so a slow history query never delays the request details above it.

### 5. Update Workflow

> *Allow status and assignee updates through API operations. Immediate feedback, prevent duplicate actions, handle latency/failure gracefully including rollback.*

This is the requirement with the most hidden depth, so it gets the most machinery:

| Concern | Mechanism |
|---|---|
| Immediate feedback | `useOptimistic` applies the new status/assignee before the server responds |
| Rollback | React reverts the optimistic value when the transition ends without a matching server state. A thrown action additionally surfaces in the nearest error boundary |
| Duplicate submission (double-click) | The control is `disabled` while `pending`, and Next.js dispatches Server Actions sequentially per client |
| Duplicate submission (retry, double network delivery) | A client-generated `idempotencyKey` is stored with a unique constraint. A replay returns the original result instead of writing twice |
| Lost updates (two users, same record) | Optimistic concurrency: `UPDATE ... WHERE id = ? AND version = ?`. Zero rows affected means a conflict, surfaced as a recoverable "this request changed" message with the current value |
| Invalid transitions | An explicit status state machine rejects e.g. `closed → in_progress` |
| Read-your-writes | `updateTag()` expires the affected cache entries immediately, so the next read shows the change rather than stale data |

Detail: [07 · Mutations](./07-mutations-and-client-state.md).

### 6. Application States

> *Meaningful loading, empty, validation, success, error and not-found experiences.*

| State | Mechanism |
|---|---|
| Loading | `loading.tsx` for route transitions; `<Suspense>` with a skeleton that matches the real table geometry, so there is no layout shift |
| Empty | Two distinct empty states: "no requests exist yet" and "no results for these filters" with a clear-filters action. Conflating them is a common and unhelpful shortcut |
| Validation | Field-level errors returned from the Server Action as values, rendered next to the input and linked with `aria-describedby` |
| Success | `sonner` toast plus the durable state change in the UI. A toast alone is not feedback if the row does not change |
| Error | `error.tsx` per route segment with a working `retry()`; `global-error.tsx` as the last resort |
| Not found | `not-found.tsx` scoped to the request detail segment, plus a root `not-found.tsx` |

Detail: [08 · UI states](./08-ui-states-and-accessibility.md).

### 7. Performance & Scale

> *Assume 10,000+ requests. Avoid unnecessary rendering, network calls and client-side JavaScript.*

| Lever | Mechanism |
|---|---|
| Never load 10,000 rows | Server-side filtering, sorting and pagination. The client receives one page at a time |
| Deep pagination stays cheap | Keyset pagination on an indexed `(sort_key, id)` tuple. `OFFSET 9800` is O(n); a cursor is O(log n) |
| Counts stay cheap | Exact count only below a threshold; above it, a capped count that renders as "10,000+" |
| Search stays cheap | SQLite FTS5 index, not `LIKE '%term%'` |
| Minimal client JS | Table body server-rendered. Client islands: `SearchInput`, `FilterBar`, `PerPageSelect`, `RowStatusControl`, detail update controls, `UserMenu`, `ToasterHost` — see [14](./14-ui-component-plan.md#client-javascript-budget) |
| No redundant queries | `React.cache()` for per-request deduplication; `use cache` + `cacheLife` for low-cardinality reference data |
| Fast navigation | Partial Prerendering is the default with Cache Components. The static shell is served immediately while user-scoped content streams |
| Bundle discipline | `optimizePackageImports`, `next/dynamic` for genuinely heavy and rarely used UI |

Detail: [04 · Scale](./04-data-model-and-scale.md), [05 · Rendering and caching](./05-rendering-and-caching.md).

Note on virtual scrolling: it is deliberately **not** used for the main table. A 10–100 row server-paginated page does not benefit from virtualisation, and adding it would introduce a scroll container that harms keyboard and screen-reader navigation for no gain. It is used in exactly one place where a genuinely long client-side list exists — the assignee picker. Reaching for virtualisation where pagination is the right answer is a common misapplication.

### 8. Responsive UI & Accessibility

> *Desktop, tablet and mobile layouts; reasonable keyboard, semantic HTML and accessibility practices.*

| Aspect | Mechanism |
|---|---|
| Desktop | Full `<table>` with sortable column headers using `aria-sort` |
| Tablet | Same table, lower-priority columns hidden with CSS only — no JS breakpoint detection, no hydration mismatch |
| Mobile | The same semantic data reflows into a card list via CSS. One DOM, one source of truth |
| Keyboard | Every control reachable and operable; visible focus rings; Base UI primitives provide correct focus trapping and roving tabindex for menus and dialogs |
| Semantics | Real `<table>`, `<th scope>`, `<nav>` for pagination, `<time datetime>`, `<form>` for filters so it works without JS |
| Announcements | `aria-live="polite"` region announces result counts and action outcomes |
| Verification | `jest-axe` in component tests and `@axe-core/playwright` on key flows |

Detail: [08 · UI states and accessibility](./08-ui-states-and-accessibility.md), [14 · UI component plan](./14-ui-component-plan.md).

### 9. Advanced JavaScript

> *A utility that summarizes a large activity dataset per assignee, returning total assigned, total resolved and average resolution time while handling incomplete/invalid records efficiently.*

`lib/summarize-activity/` — a pure, dependency-free, single-pass aggregator. It accepts any iterable (including async iterables and generators, so it can consume a stream without materialising it), validates each record inline, accumulates into a `Map`, and reports rejected records with reasons rather than silently dropping them. It is O(n) time and O(k) space in the number of assignees, not the number of records.

This is the most unit-testable artefact in the codebase, and it is tested accordingly, including with a 100,000-record property-style fixture.

Detail: [10 · Activity summary utility](./10-activity-summary-utility.md).

### 10. Code Architecture

> *Clear, maintainable project structure with reusable components, separation of concerns, consistent naming and appropriate error handling.*

Four layers with a one-way dependency rule enforced by ESLint rather than by convention alone: routes → features → services → repositories → database. Pure utilities sit outside and may be imported by anything. Nothing in `server/` may import from `app/`.

Detail: [03 · System architecture](./03-system-architecture.md).

## Deliverables

| Deliverable | Where |
|---|---|
| Complete runnable source code | Repository root |
| README with setup/run instructions and test credentials | `/README.md` — copy from [15 · Local setup](./15-local-setup.md) |
| Technical note on major decisions | [12 · Technical note](./12-technical-note.md) |
| Runs locally with no paid external service | SQLite file database, in-process cache, in-memory rate limiter. No Docker, no cloud account, no API keys |

## Test matrix

Each brief requirement maps to the spec or test that proves it. Full E2E list: [09 · Testing strategy](./09-testing-strategy.md#layer-4--end-to-end-tests).

| # | Requirement | Proves |
|---|---|---|
| 1 | Authentication & access | `auth.spec.ts`; `request.service` integration (unauthenticated rejected); rate-limit unit test |
| 2 | Request dashboard | `dashboard.spec.ts`; column render + default page size (10 rows) |
| 3 | Search, filter & navigation | `search.spec.ts`, `filters.spec.ts`, `pagination.spec.ts`; `lib/search-params/` unit tests; 12k pagination integration test |
| 4 | Request details | `detail.spec.ts` (direct URL, refresh, activity, not-found) |
| 5 | Update workflow | `update-status.spec.ts`, `update-assignee.spec.ts`, `update-failure.spec.ts`, `conflict.spec.ts`, `duplicate-submit.spec.ts`; status machine N×N unit test; idempotency + version integration tests |
| 6 | Application states | `empty-state` component test; `error.tsx` retry in E2E; `jest-axe` on forms |
| 7 | Performance & scale | `EXPLAIN QUERY PLAN` integration assertion; 12k keyset pagination test; `next experimental-analyze` in Phase 7 |
| 8 | Responsive UI & accessibility | `responsive.spec.ts`, `a11y.spec.ts`; keyboard-only Playwright journey |
| 9 | Advanced JavaScript utility | `lib/summarize-activity/` unit suite incl. 100k-record test; `insights.spec.ts` |
| 10 | Code architecture | ESLint `import/no-restricted-paths` (layer violation fails lint); folder structure in [03](./03-system-architecture.md) |
| — | Role-scoped access | `access-control.spec.ts` — agent sees assigned only; viewer has no update controls |

## Requirements this design intentionally exceeds

Worth flagging so they read as deliberate rather than accidental scope creep:

- **Optimistic concurrency control.** The brief asks for rollback on API failure. It does not ask about two users editing the same request. A service request tool without it silently loses updates, so it is included.
- **Idempotency keys.** "Prevent duplicate actions" can be satisfied by disabling a button. That fails on retry and on double network delivery, so the server enforces it too.
- **A status state machine.** The brief says "update status". Allowing any status to transition to any other is not a workflow.

## Requirements this design intentionally does not cover

- **Creating** service requests. The brief describes review and management of incoming requests, not intake. A create form would add surface area without demonstrating anything the update flow does not already demonstrate.
- Real-time push updates. Polling or SSE would be a fair extension but adds infrastructure concerns that obscure the core assessment.
- Multi-tenancy, i18n, and audit export. Noted as extension points in [11 · Roadmap](./11-implementation-roadmap.md).
