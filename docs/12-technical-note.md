# 12 · Technical Note

> This is the brief's requested *"brief technical note explaining major decisions: Server vs Client Components, state/data-fetching approach, performance considerations and application structure."* It is written to stand alone. The other documents in this folder are the supporting detail.

## Context

**As-Sunnah Desk** — a service request management portal built on Next.js 16.3.5 with React 19.2, TypeScript in strict mode, and no separate backend. Data is stored in a local SQLite database seeded with 12,000 service requests and roughly 48,000 activity records, so the behaviour described below is measured rather than assumed. Nothing in the stack requires a paid service, an API key, or Docker.

One note on the framework version, because it shaped the implementation more than a minor version bump normally would. Next.js 16 renamed `middleware` to `proxy`, replaced experimental Partial Prerendering with a `cacheComponents` model, changed `revalidateTag`'s signature, added `updateTag` and `refresh`, removed `next lint`, and made `params`/`searchParams` Promises with no synchronous fallback. Every API used here was verified against the documentation bundled in `node_modules/next/dist/docs/` for the exact installed version.

## Server vs Client Components

**The default is server. `'use client'` is applied to the smallest leaf that genuinely needs it.**

`'use client'` marks a module *boundary*, not a component: everything a client file imports joins the client bundle. So the directive sits on individual controls rather than on containers.

| Server Components | Client Components |
|---|---|
| Pages and layouts | Filter bar (`SearchInput` debounces via `useDebouncedCallback`; other filters commit immediately) |
| The request table and its rows | Status and assignee controls |
| The activity timeline | Login form |
| Pagination (anchors — needs no JS) | Toast host |
| Empty states, skeletons | — |

The row status control is the illustrative case. Each row is a Server Component, and only the status dropdown inside it is a client island. At `perPage=100` that is 100 small islands over server-rendered markup — linear in page size, but far smaller than hydrating an entire client-rendered table.

Two structural rules made the difference in practice:

**Never `await` at the top of a page or layout.** `searchParams` is passed down as a promise and awaited inside a Suspense boundary. A top-level `await` in the portal layout would hold `{children}` — every page in the application — behind the session read, defeating streaming entirely.

**Read the session once.** The current user is resolved in one place and shared with Client Components by passing the promise through context and unwrapping it with `use()`, rather than each component reading cookies again.

## Data fetching and state

**Reads are Server Components querying the database directly. Writes are Server Actions. There is no client-side data layer.**

No SWR, no TanStack Query, no Redux, no Zustand. That absence is the design, not an omission: a client cache over server-rendered data means maintaining a second source of truth for the same records, and the desynchronisation bugs that follow.

State is partitioned so that each kind lives in exactly one place:

| State | Lives in | Why |
|---|---|---|
| Request data | Database | The source of truth, never mirrored client-side |
| Search, filters, sort, pagination | **The URL** | Shareable, bookmarkable, back-button-correct, server-readable |
| Current user | Server session, shared via context | Derived from the request |
| Search input text | Local component state | Transient; the URL updates on a 300 ms debounce |
| Optimistic status | `useOptimistic` | Transient by definition; reverts automatically |

**The URL as the single source of truth for filter state** is the decision with the widest effect. One Zod schema defines the contract; the server parses it to build the query, and the client parses it to render the controls. Direct URL access and refresh work with no rehydration, because there is no client state to rehydrate. Every view is shareable. The back button works because history *is* the state history. A malformed URL falls back to defaults rather than throwing, so a truncated link does not break the dashboard.

Mutations use Server Actions with a consistent four-step preamble — validate with Zod, authenticate against the session, authorize the capability, then execute. Expected failures are **returned** as a typed `Result` rather than thrown, following the framework's own guidance, so every failure mode the UI must handle is visible in the type signature.

## The update workflow

This is where the brief's language is most demanding, so it is worth being specific. "Prevent duplicate actions" is four distinct problems, and a disabled button solves only the first:

| Failure | Mechanism |
|---|---|
| Impatient double-click | Control `disabled` while the transition is pending |
| Duplicate network delivery or retry | Client-generated idempotency key with a unique database constraint |
| Two users editing the same request | Optimistic concurrency: `UPDATE ... WHERE id = ? AND version = ?`. Zero rows means conflict |
| Invalid transition (`closed → in_progress`) | An explicit status state machine, which also drives the UI's options |

Rollback needs almost no code: `useOptimistic` applies the change immediately, and React discards it when the transition ends, so a failed action returns the UI to the server value automatically. What *is* written is the recovery path — a conflict reports the current server value and offers a reload, because "someone else changed this" is useless without a way forward.

After a successful write, `updateTag()` expires the affected cache entries immediately. This is read-your-writes semantics, new in Next.js 16, and the right choice here: `revalidateTag` would serve stale content while refreshing in the background, which is fine for a blog and wrong for a work queue where someone just changed a status and needs to trust what they see.

## Performance

The target was to make the cost of a page view independent of the table size.

**Server-side everything.** Filtering, sorting and pagination happen in SQL. The client receives one page of rows (10–100 per URL `perPage`) regardless of whether the table holds 12,000 or 12 million.

**Keyset pagination rather than offset.** `LIMIT 25 OFFSET 9800` makes the database produce and discard 9,800 rows, so the last page is the slowest — backwards from what users expect. A cursor comparing the indexed `(updated_at, id)` tuple is O(log n) at any depth, and it is immune to the row-shifting that causes offset pagination to duplicate or skip records during concurrent inserts. The trade-off is that keyset gives next/previous rather than "jump to page 47", so bounded page numbers are offered for the first 20 pages where offset is still cheap.

**Indexes matched to queries, and asserted.** Composite indexes cover each filter-plus-sort combination, every sort index ends in `id` so the keyset comparison is a pure index seek, and search uses an FTS5 inverted index rather than `LIKE '%term%'`, which cannot use an index at all. A test asserts that `EXPLAIN QUERY PLAN` for the list query contains no table scan — a performance claim that is not asserted will regress.

**Caching matched to the data.** Low-cardinality, shared reference data (categories, assignable users, facet counts) uses `use cache` with `cacheLife`. The request list is deliberately **not** cached: its key would include every filter combination and cursor, producing near-unbounded entries with a hit rate near zero, and it is the data that must be freshest. Choosing not to cache, for stated reasons, is a caching strategy.

**Partial Prerendering.** With `cacheComponents` enabled, every route produces a static shell served immediately, while user-scoped content streams in behind Suspense boundaries. The user sees the header, navigation, filter bar and a correctly-sized table skeleton before any query runs.

**No unnecessary re-rendering.** The React Compiler handles memoisation, so there is almost no hand-written `useMemo` or `useCallback`. Refining a filter keeps the previous results visible via `useTransition` rather than replacing them with a skeleton.

**No unnecessary client JavaScript.** Only four interactive pieces ship to the browser. The responsive layout is pure CSS — one DOM becomes a table on desktop and cards on mobile — so there is no breakpoint detection, no hydration mismatch, and no layout shift.

On virtualisation: it is used in exactly one place, the assignee picker, and deliberately not on the main table. A server-paginated page (10–100 rows) gains nothing from virtualisation and would lose keyboard and screen-reader quality to a scroll container. Applying it where pagination is the correct answer is a common misapplication.

## Application structure

Four layers, with dependencies pointing one way and the rule enforced by ESLint rather than convention:

```
app/ (routes, thin)  →  features/ (vertical slices)  →  server/services  →  server/repositories  →  server/db
                                    ↘         lib/ (pure, imports nothing)        ↙
```

Routes read the URL, compose components, and place Suspense and error boundaries — no queries, no business logic. Features are organised as vertical slices (a feature's actions, components and schemas together) because changes arrive by feature, not by technical layer. `lib/` imports nothing, which is what makes the activity-summary utility testable with no mocks and no framework.

**Authorization lives next to the data.** Every read and write passes through a Data Access Layer that re-verifies the session itself, so no caller can forget. This matters concretely: Server Actions are reachable by direct `POST` even when nothing in the UI links to them, so a page-level check protects nothing. `proxy.ts` performs a cheap optimistic cookie check to redirect early, but it is never the security boundary — it does no database access, because it runs on every request including prefetches.

Role scoping is applied by **narrowing the query**, not by filtering results. Post-filtering breaks pagination (a page of 25 returns 4 rows), breaks counts, and leaks existence through totals.

Repositories return narrow DTOs with explicitly selected columns. This is a security boundary as much as a performance one: anything returned from a Server Component lands in the RSC payload and reaches the browser, so `password_hash` must never be in the object in the first place.

## Trade-offs made knowingly

A design with no trade-offs is a design that has not been thought about. The four worth surfacing:

**Nonce-based CSP was not used.** The documented nonce approach requires dynamic rendering and is explicitly incompatible with PPR, which `cacheComponents` makes the default. A strict static CSP covers every directive that does not need per-response nonces, and the application ships no inline scripts, no inline event handlers, and no `dangerouslySetInnerHTML`. For a public application accepting user-generated content, this decision would go the other way.

**Sessions are stateless, so they cannot be revoked before expiry.** Sign-out clears the cookie on that device. The upgrade is a `sessions` table, and because every read already passes through `requireUser()`, it changes one function.

**Rate limiting is in-memory**, so it is per-process and resets on restart. Correct for a deliverable that must run with no external service; the seam is a single function for a Redis swap.

**Counts are capped.** Above 1,000 matches the UI shows "1,000+" rather than an exact figure, because an exact filtered count is a full scan of the matching set on every page load — a poor trade for a number most users only glance at.

## Where this breaks

| Scale | Status |
|---|---|
| 10k–100k requests | Works as designed |
| ~1M | Works; counts get coarser, some filter combinations want covering indexes |
| 10M+ | Swap SQLite for PostgreSQL. Only the database client and the FTS implementation change; repository signatures do not |
| High write concurrency | SQLite serialises writes. Not a constraint for single-record updates in a read-heavy portal; it would be for bulk operations |

The repository interface is the seam that keeps the PostgreSQL migration contained, and it is the main reason services never talk to the ORM directly.

## Summary of the four decisions that mattered most

1. **The URL is the single source of truth for filter state.** Eliminates a class of synchronisation bugs and makes direct access, refresh, sharing and the back button work by construction rather than by effort.
2. **Keyset pagination with indexes asserted in tests.** Makes "10,000+ records" a non-event, and keeps it that way.
3. **Authorization in a Data Access Layer, not at the route.** The only placement that also protects Server Actions, which are public endpoints whether or not you treat them as such.
4. **Cache what is shared and stable; stream what is per-user and fresh.** Reference data is cached with a lifetime; the request list is not, for reasons that are stated rather than assumed.
