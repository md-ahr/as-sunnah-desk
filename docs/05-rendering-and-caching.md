# 05 · Rendering and Caching

This is the most version-specific document here. Next.js 16's caching model is not the Next.js 14 model with new names — it is a different model, and every API below was verified against the bundled docs for 16.3.5.

## The model in one paragraph

With `cacheComponents: true`, the static/dynamic boundary is **per component, not per route**. Every route produces a static shell at build time; anything that reads request data or performs uncached I/O sits behind a `<Suspense>` boundary and streams in at request time. Caching is opt-in per function via `use cache`, and each cached result carries a lifetime that determines whether it can join the static shell and the prefetch. This is Partial Prerendering, and in Next.js 16 it is the default rather than a flag.

Practically, that means the interesting question for every component is no longer "is this page static or dynamic" but **"can this specific piece of data be cached, and if not, what does the user see while it loads?"**

## Configuration

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true, // already enabled
  cacheComponents: true, // use cache, cacheLife, cacheTag, PPR
  partialPrefetching: true, // per-route App Shell prefetch (16.3+, requires cacheComponents)
  typedRoutes: true, // typed <Link href> and router methods
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
```

`partialPrefetching` requires `cacheComponents` — config validation throws otherwise.

## Classifying the data

Every read in this application falls into one of four buckets, and the bucket determines the mechanism. Getting this table right is most of the work; the code then follows from it.

| Data                             | Cardinality     | Per user? | Freshness need | Mechanism                                         |
| -------------------------------- | --------------- | --------- | -------------- | ------------------------------------------------- |
| Categories, statuses, priorities | Very low        | No        | Minutes        | `use cache` + `cacheLife('hours')`                |
| Assignable users list            | Low             | No        | Minutes        | `use cache` + `cacheLife('minutes')`              |
| Facet counts per status          | Low             | No        | Minutes        | `use cache` + `cacheLife('minutes')` + `cacheTag` |
| Current user                     | One per session | **Yes**   | Per request    | `use cache: private`                              |
| Request list page                | **Very high**   | Yes       | Immediate      | **Not cached** — streams behind Suspense          |
| Single request + history         | High            | Yes       | Immediate      | **Not cached** — streams behind Suspense          |
| Assignee summary (insights)      | Low             | No        | Hours          | `use cache` + `cacheLife('hours')`                |

### Why the request list is deliberately not cached

This is the decision most likely to be questioned, so it is worth defending directly.

The list query is keyed on the full filter combination: search text, multiple statuses, priorities, categories, assignees, sort order, and cursor. Under `use cache`, arguments become part of the cache key — so caching it would create a near-unbounded number of entries, each used approximately once. That is not a cache; it is a memory leak with a hit rate near zero.

It is also the data that must be freshest. A user who changes a status expects the list to reflect it immediately.

So the list streams uncached behind a Suspense boundary, and the performance work goes where it actually pays: the SQL is a keyset seek over a composite index returning one page of rows (default 10, up to 100 via `perPage`), which is fast enough that caching it would be optimising the wrong layer. What _is_ cached is the surrounding low-cardinality reference data — the category names, the assignee list, the facet counts — which would otherwise be re-queried on every page view.

Choosing not to cache, for stated reasons, is a caching strategy. Caching everything reachable is not.

## Page composition

The dashboard demonstrates all three rendering modes on one route:

```tsx
// app/(portal)/requests/page.tsx  — Server Component
import { Suspense } from 'react'
import { FilterBar } from '@/features/requests/components/filter-bar'
import { RequestTable } from '@/features/requests/components/request-table'
import { RequestTableSkeleton } from '@/features/requests/components/request-table-skeleton'
import { FacetCounts, FacetCountsSkeleton } from '@/features/requests/components/facet-counts'
import { getFilterOptions } from '@/features/requests/queries/filter-options'

// Not async: this page never awaits anything at the top level.
export default function RequestsPage(props: PageProps<'/requests'>) {
  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Static — in the shell at build time */}
      <header>
        <h1 className="text-2xl font-semibold">Service requests</h1>
      </header>

      {/* Cached reference data — also in the shell */}
      <Suspense fallback={<FilterBarSkeleton />}>
        <FilterBarLoader searchParams={props.searchParams} />
      </Suspense>

      <Suspense fallback={<FacetCountsSkeleton />}>
        <FacetCounts searchParams={props.searchParams} />
      </Suspense>

      {/* Uncached, user-scoped — streams at request time */}
      <Suspense fallback={<RequestTableSkeleton rows={25} />}>
        <RequestTable searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}
```

Three details carry real weight here.

**The page component is not `async` and awaits nothing.** `searchParams` is passed down as a promise and awaited inside the boundaries. This is the "push dynamic access down" pattern from the streaming guide: the deeper the `await`, the more of the page prerenders. If this page did `const { q } = await props.searchParams` at the top, nothing below it could be in the static shell and the whole benefit would be lost.

**The skeleton matches the real geometry.** `<RequestTableSkeleton rows={perPage} />` renders the current page size (default 10) at the same height as real rows, so the shell reserves the correct space and there is no layout shift when content arrives. A spinner would technically satisfy "provide a loading state" while making the perceived experience worse.

**Each boundary is independent.** A slow facet count query cannot delay the table, and vice versa.

## The cached functions

```tsx
// features/requests/queries/filter-options.ts
import { cacheLife, cacheTag } from 'next/cache'
import { listCategories, listAssignableUsers } from '@/server/repositories/reference.repository'

export async function getFilterOptions() {
  'use cache'
  cacheLife('minutes')
  cacheTag('reference:filters')

  const [categories, assignees] = await Promise.all([listCategories(), listAssignableUsers()])
  return { categories, assignees }
}
```

Note `Promise.all` rather than sequential `await`s — two independent queries should not be serialised. Where partial failure should be tolerated, `Promise.allSettled` is used instead, since `Promise.all` fails the whole operation if either rejects.

### The current user, and why it needs `use cache: private`

The session read is the awkward case, and it is worth understanding rather than working around.

A plain `use cache` function **cannot call `cookies()`** — it throws. The usual workaround is to read the runtime value outside and pass it in as an argument, but that does not work for a session: the session helper reads the cookie deep inside its own code, and validating it compares a sealed token against the current time. There is nothing to lift out.

`use cache: private` exists for exactly this. It can read `cookies()` and `headers()` directly, and it keeps the result **in the browser only** — never in a server-side cache:

```tsx
// server/auth/dal.ts
import 'server-only'
import { cacheLife } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './session'
import { findActiveUserById } from '@/server/repositories/user.repository'

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  'use cache: private'
  cacheLife('minutes') // stale 5m — above the 30s prefetch floor

  const { userId } = await getSession()
  if (!userId) redirect('/login')

  const user = await findActiveUserById(userId)
  if (!user) redirect('/login')

  // Narrow DTO. Never the raw row.
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}
```

Two subtleties that are easy to get wrong:

The `redirect()` calls throw to interrupt rendering, so they are never cached — only a resolved user is. That is the behaviour you want, and it happens to fall out of how `redirect` works.

The `stale` value matters more than it looks. The client router enforces a 30-second minimum, and content needs `stale ≥ 5 minutes` to be included in the App Shell. `cacheLife('minutes')` gives a 5-minute stale window, which qualifies. Tuning this below 30 seconds would silently drop authenticated content out of prefetching — a performance regression with no error message.

### Sharing the user with Client Components

Rather than each component re-reading the session, the promise is created once inside the boundary and passed through context, unwrapped with `use()`:

```tsx
// app/(portal)/layout.tsx
export default function PortalLayout({ children }: LayoutProps<'/(portal)'>) {
  return (
    <div className="min-h-dvh">
      <Suspense fallback={<HeaderSkeleton />}>
        <PortalHeader /> {/* creates the promise inside the boundary */}
      </Suspense>
      {children}
    </div>
  )
}
```

The layout is **not** `async` and does not await the session. A top-level `await` on the session in a layout would hold the entire segment — including `{children}` — behind that request, which defeats streaming for every page inside it. The session read is pushed into `PortalHeader`, inside a boundary.

## Cache invalidation

Tags are centralised so a typo cannot silently disable invalidation:

```ts
// server/cache/tags.ts
export const tags = {
  request: (id: string) => `request:${id}` as const,
  requestActivity: (id: string) => `request-activity:${id}` as const,
  referenceFilters: () => 'reference:filters' as const,
  facetCounts: () => 'facet-counts' as const,
  assigneeSummary: () => 'assignee-summary' as const,
}
```

Which invalidation API to use is a real decision in Next.js 16, because there are now four and they behave differently:

| API                           | Callable from            | Semantics                                           | Used here for                                                        |
| ----------------------------- | ------------------------ | --------------------------------------------------- | -------------------------------------------------------------------- |
| `updateTag(tag)`              | **Server Actions only**  | Expires immediately; next read waits for fresh data | **Status and assignee updates** — the user must see their own change |
| `revalidateTag(tag, profile)` | Actions + Route Handlers | Stale-while-revalidate                              | Background refresh of facet counts                                   |
| `refresh()`                   | **Server Actions only**  | Refreshes the client router                         | After mutations that change surrounding chrome                       |
| `revalidatePath(path, type?)` | Actions + Route Handlers | Path-based invalidation                             | Not used — tag-based is more precise                                 |

`updateTag` is the right primitive for this application's update workflow, and it is new in 16. It provides read-your-writes: the mutation expires the cache and the next read blocks for fresh data, so a user never sees their own change reflected as stale. `revalidateTag` would show stale content while refreshing in the background — acceptable for a blog, wrong for a work queue where someone just changed a status and needs to trust what they see.

Note the breaking change: `revalidateTag(tag)` with one argument is deprecated in 16 and now raises a TypeScript error. The second argument is a `cacheLife` profile — `revalidateTag('facet-counts', 'max')` for stale-while-revalidate.

```ts
// Inside the update-status Server Action, after a successful write:
updateTag(tags.request(id))
updateTag(tags.requestActivity(id))
revalidateTag(tags.facetCounts(), 'max') // counts can lag a moment
```

The distinction is intentional: the record the user just edited must be immediately correct; an aggregate count in a filter sidebar can be a few seconds stale.

## Prefetching and navigation

With `partialPrefetching: true`, the router prefetches each route's **App Shell** — the part of the render that does not depend on the link's URL. For a route that reads `cookies()`, that shell includes the session-derived content and is cached per session on the client.

The request list links to detail pages, whose content depends on `params`. Those need per-link prefetching:

```tsx
<Link href={`/requests/${request.reference}`} prefetch={true}>
  {request.subject}
</Link>
```

**This is not free, and the cost is worth stating.** `prefetch={true}` costs one server invocation per prefetchable link. At the default page size (10 rows) that is up to 10 prefetch renders as rows enter the viewport (up to 100 at max `perPage`). The trade is real: navigation becomes instant, but the server does speculative renders for a user who will click at most a few.

> **Decision — `prefetch={true}` on the subject link only, not on every interactive element in the row.**
>
> One prefetch per row, not four. And because the detail query is a single indexed primary-key lookup, each prefetch is cheap. If profiling showed this to be a problem, the fallback is the default `prefetch="auto"`, which prefetches only the shared App Shell — bounded by route count rather than by link count.

## Reading the same data twice in one request

Server Components compose freely, which means the same data can be requested from several places in one render. `React.cache()` deduplicates within a single request:

```ts
// server/repositories/request.repository.ts
import { cache } from 'react'

export const findRequestById = cache(async (id: string) => {
  // ...
})
```

This is request-scoped memoisation, not caching — nothing is shared between requests or users. It is what lets the detail page and its `generateMetadata` both ask for the request without querying twice. Worth noting: each `use cache` boundary has its own isolated `React.cache` scope, so a memoised value from outside is not visible inside a cached function.

## Metadata

Under Cache Components, `generateMetadata` follows the same rules as any component. If it reads runtime data or performs uncached I/O, it defers to request time:

```tsx
export async function generateMetadata(props: PageProps<'/requests/[id]'>): Promise<Metadata> {
  const { id } = await props.params
  const request = await findRequestById(id) // memoised; page reuses it
  if (!request) return { title: 'Request not found' }
  return {
    title: `${request.reference} · ${request.subject}`,
    robots: { index: false, follow: false }, // internal tool
  }
}
```

`robots: { index: false }` is correct for an authenticated internal portal and removes a class of accidental exposure.

Note that `viewport` cannot stream — unlike metadata, it affects initial paint — so it stays a static export in the root layout.

## The CSP conflict, stated plainly

There is a genuine incompatibility here that a design document should name rather than gloss over.

The Next.js docs describe nonce-based CSP as requiring dynamic rendering, and state that it disables static generation and CDN caching and is **incompatible with PPR**. Since `cacheComponents: true` makes PPR the default, nonce-based CSP and this design's rendering strategy cannot both be used as-is.

The resolution, and the reasoning, is in [06 · Auth and security](./06-auth-and-security.md#content-security-policy): a strict CSP is applied for every directive that does not require per-response nonces, the application ships no inline event handlers or inline scripts of its own, and the nonce trade-off is documented rather than silently dropped. If a nonce CSP were a hard requirement, the correct response would be to disable `cacheComponents` and accept slower navigation — a trade to make explicitly, not by accident.

## Bots and crawlers

One behaviour worth knowing because it can surprise you in production: bots are detected by user agent and handled differently. Rather than receiving the static shell, they get a full dynamic render at request time. Work that completed at build time therefore runs at request time for a crawler — so if the shell depended on something only available during prerendering, a page that loads for a human can fail for a bot.

Not a practical concern here (the portal is authenticated and `noindex`), but it is the reason the data feeding the shell is ordinary database access available in both environments.

## Verification

Rendering behaviour is asserted, not assumed:

1. `pnpm build` output is reviewed for the per-route static/dynamic classification.
2. The dev overlay's instant-navigation insights must be clean. Cache Components surfaces `blocking-route` warnings naming the exact route and offering fixes; a warning means a boundary is in the wrong place.
3. A Playwright test asserts the shell renders before data arrives — the skeleton must be present in the initial HTML.
4. Client bundle size per route is checked with `next experimental-analyze` (the Turbopack analyser, since `next build` in 16 no longer reports First Load JS — those metrics were removed as inaccurate for server-driven architectures).
