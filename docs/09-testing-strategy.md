# 09 · Testing Strategy

## The constraint that shapes everything

The Next.js documentation is unambiguous on this point:

> "Since `async` Server Components are new to the React ecosystem, **Vitest currently does not support them**. While you can still run unit tests for synchronous Server and Client Components, we recommend using E2E tests for `async` components."

Most of this application *is* async Server Components. So the usual testing pyramid does not apply cleanly, and pretending otherwise would produce a suite with high coverage numbers and low confidence.

The shape that follows is deliberate: **heavy unit testing of pure logic, integration testing of the server layer against a real database, and Playwright carrying the weight for anything that renders an async Server Component.**

```
        ╱ E2E (Playwright) ╲          Critical flows, async Server Components,
       ╱   ~12 specs        ╲         keyboard and accessibility passes
      ╱─────────────────────╲
     ╱ Integration (Vitest)  ╲        Services + repositories against a real
    ╱    ~40 tests            ╲       SQLite database. No mocks.
   ╱───────────────────────────╲
  ╱ Unit (Vitest)               ╲     Pure functions, state machine, URL parsing,
 ╱     ~120 tests                ╲    the activity summary utility
╱─────────────────────────────────╲
```

Coverage target is above 80%, but the number is a by-product rather than the goal. The aggregation utility and the state machine approach 100% because they are pure and cheap to test exhaustively; the route layer is covered by E2E rather than by unit tests, because that is where the framework actually supports testing it.

## Layer 1 · Unit tests

Pure functions with no I/O, no framework, and no mocks. These are fast, and they cover the logic most likely to be subtly wrong.

| Target | What is asserted |
|---|---|
| `lib/summarize-activity/` | Correctness, invalid-record handling, empty input, precision, 100k-record performance. See [10](./10-activity-summary-utility.md) |
| `request-status.machine.ts` | Every legal transition allowed; every illegal one rejected; `closed` is terminal; exhaustive over the full status matrix |
| `lib/search-params/` | Round-trip parse/serialise; malformed input falls back to defaults; array params; cursor encode/decode; unknown `sort` rejected; unknown category slugs stripped; slug round-trip (`it-support`) |
| `lib/hooks/use-debounced-callback.ts` | Fires once after delay; cancels pending call on unmount; rapid calls reset the timer |
| `server/auth/permissions.ts` | Each role's capability set; a capability absent from a role is denied |
| `lib/format/` | Relative dates across boundaries, timezone handling, text truncation on word boundaries |
| `lib/result.ts` | Type narrowing behaves as intended (compile-time assertions) |

The state machine test is worth showing, because exhaustiveness is the point:

```ts
// Generated over the full matrix, so a new status cannot be added without a decision about it
describe('status transitions', () => {
  const all = REQUEST_STATUSES

  it.each(all.flatMap((from) => all.map((to) => [from, to] as const)))(
    '%s → %s matches the declared machine',
    (from, to) => {
      expect(canTransition(from, to)).toBe(STATUS_TRANSITIONS[from].includes(to))
    },
  )

  it('treats closed as terminal', () => {
    expect(all.filter((to) => canTransition('closed', to))).toEqual([])
  })
})
```

Testing the full N×N matrix rather than a handful of cases means adding a status forces an explicit decision about every transition into and out of it.

## Layer 2 · Integration tests

Services and repositories tested against a **real SQLite database**, not mocks.

```ts
// src/test/db.ts
export async function createTestDb() {
  const client = createClient({ url: ':memory:' })   // fresh per suite
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: './drizzle' })
  return { db, client }
}
```

> **Decision — no repository mocks.**
>
> An in-memory SQLite database initialises in milliseconds, so the usual reason for mocking (speed) does not apply. And the things most worth verifying here *are* database behaviours: does the keyset predicate paginate correctly, does the unique constraint actually reject a duplicate idempotency key, does the version-conditional `UPDATE` return zero rows under conflict. A mocked repository would assert that the code calls the functions the test expects it to call — which is a restatement of the implementation, not a test of behaviour.

| Target | What is asserted |
|---|---|
| `request.repository` | Filter combinations; keyset pagination has no gaps or duplicates across pages; whitelisted sorts; FTS matching including stemming |
| Index usage | `EXPLAIN QUERY PLAN` for the list query contains no `SCAN service_requests` |
| `request.service` | Unauthenticated is rejected; agents see only assigned requests; invalid transitions rejected; conflict returns `CONFLICT` with the current value |
| Idempotency | The same key twice produces one activity row and one version increment |
| Concurrency | Two sequential updates with the same stale `version` — the second returns a conflict |
| `activity.repository` | Chronological ordering; pagination of long histories |
| Password hashing | Verify succeeds for the correct password, fails otherwise; the hash is never equal to the plaintext |
| Rate limiter | Allows up to the limit, blocks beyond it, recovers after the window |

The pagination test is the one that catches real bugs:

```ts
it('paginates 12,000 rows with no gaps or duplicates', async () => {
  await seedRequests(db, 12_000)

  const seen = new Set<string>()
  let cursor: Cursor | null = null

  for (let page = 0; page < 480; page++) {
    const result = await listPaged(defaultFilters, cursor, 25)
    for (const row of result.items) {
      expect(seen.has(row.id)).toBe(false)   // no duplicates
      seen.add(row.id)
    }
    if (!result.nextCursor) break
    cursor = result.nextCursor
  }

  expect(seen.size).toBe(12_000)             // no gaps
})
```

This is exactly the assertion that catches a keyset predicate using `<` where it needs `<=`, or a tie-break that omits `id` — bugs that are invisible on page one and only appear where `updated_at` values collide.

## Layer 3 · Component tests

Limited by design to what the tooling genuinely supports: **synchronous Client Components**.

| Target | What is asserted |
|---|---|
| `StatusControl` | Optimistic value shows immediately; control disabled while pending; reverts on error; illegal transitions absent from the menu; disabled when `canEdit` is false |
| `AssigneeControl` | Combobox filters list; optimistic assignee label; disabled when `canEdit` is false |
| `SearchInput` | Debounce fires once for rapid input; `cursor` removed from the URL; uses `replace` not `push` |
| `LoginForm` | Field errors render and are linked by `aria-describedby`; submit disabled while pending |
| `EmptyState` | Renders the filtered variant with a clear action, and the unfiltered variant without one |
| `Pagination` | Correct `href` values; disabled at boundaries |
| All of the above | `jest-axe` reports no violations |

Server Actions are stubbed at the module boundary here, since the goal is the component's behaviour — the action's own behaviour is covered at Layer 2.

```ts
// vitest.config.ts — exactly as the Next.js docs specify
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 75 },
      exclude: ['src/components/ui/**', '**/*.config.*', 'src/test/**'],
    },
  },
})
```

`src/components/ui/**` is excluded from coverage because it is vendored shadcn/ui code. Chasing coverage on third-party components inflates the number without adding confidence.

## Layer 4 · End-to-end tests

This is where async Server Components, streaming, PPR, navigation, and real browser behaviour are verified. Playwright runs against a **production build** (`next build && next start`), as the docs recommend, because prefetching only happens in production and the dev server's on-demand rendering hides exactly the classes of bug worth catching.

| Spec | What it proves |
|---|---|
| `auth.spec.ts` | Login with seeded credentials; wrong password rejected; logout; protected route redirects with `?next=`; post-login return to the original destination |
| `dashboard.spec.ts` | All required columns render; default page size (10 rows); result count shown |
| `search.spec.ts` | Debounced search updates the URL; results narrow; `cursor` cleared; back button restores the previous query |
| `filters.spec.ts` | Multiple simultaneous filters; URL reflects all of them; **a filtered URL pasted into a fresh browser context reproduces the same view** |
| `pagination.spec.ts` | Forward and back; `perPage` 10 / 25 / 50 / 100; deep page loads within budget; no duplicate rows across pages |
| `detail.spec.ts` | Navigation from the list; **direct URL access works**; **refresh preserves the view**; activity history renders; unknown id shows not-found |
| `update-status.spec.ts` | Optimistic update is visible before the response; success toast; activity history gains an entry; illegal transitions unavailable (dashboard row + detail page) |
| `update-assignee.spec.ts` | Assignee change on detail page; optimistic update; activity log entry; combobox keyboard navigation |
| `update-failure.spec.ts` | With the action route intercepted to fail, the optimistic value **rolls back** and an error is shown |
| `conflict.spec.ts` | Two contexts edit the same request; the second receives a conflict with a recovery action |
| `duplicate-submit.spec.ts` | Rapid double-click produces exactly one activity entry |
| `access-control.spec.ts` | Agent sees only assigned requests in list; viewer sees update controls disabled/absent; admin sees all |
| `insights.spec.ts` | Summary table renders per-assignee rows; rejected-records disclosure toggles |
| `responsive.spec.ts` | Card layout at 375px, table at 1280px, filter sheet traps focus |
| `a11y.spec.ts` | `@axe-core/playwright` on each key page; a full keyboard-only journey |

Three of these are the ones that matter most for this brief, because they verify requirements that are easy to claim and hard to demonstrate.

**Rollback**, verified by making the network fail rather than by trusting React:

```ts
test('rolls back the optimistic status when the action fails', async ({ page }) => {
  await login(page)
  await page.goto('/requests/SR-2026-000142')

  await expect(page.getByTestId('status-badge')).toHaveText('New')

  // Fail the Server Action POST
  await page.route('**/requests/**', (route) =>
    route.request().method() === 'POST' ? route.abort('failed') : route.continue(),
  )

  await page.getByRole('button', { name: /status/i }).click()
  await page.getByRole('menuitem', { name: 'In review' }).click()

  // Optimistic value appears first
  await expect(page.getByTestId('status-badge')).toHaveText('In review')

  // Then reverts, and the failure is explained
  await expect(page.getByTestId('status-badge')).toHaveText('New')
  await expect(page.getByRole('alert')).toContainText(/could not/i)
})
```

**Direct URL access and refresh**, which the brief calls out explicitly:

```ts
test('a filtered URL reproduces its view in a fresh context', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page)

  const url = '/requests?status=new&status=in_progress&priority=urgent&category=it-support&sort=created_desc'
  await page.goto(url)

  await expect(page.getByTestId('active-filter')).toHaveCount(4)
  await page.reload()
  await expect(page.getByTestId('active-filter')).toHaveCount(4)
  expect(page.url()).toContain('status=new')
  expect(page.url()).toContain('category=it-support')
})
```

**Duplicate prevention**, verified by counting the side effect rather than the clicks:

```ts
test('a rapid double-click produces one activity entry', async ({ page }) => {
  await login(page)
  await page.goto('/requests/SR-2026-000142')

  const before = await page.getByTestId('activity-entry').count()

  const trigger = page.getByRole('button', { name: /status/i })
  await trigger.click()
  const item = page.getByRole('menuitem', { name: 'In review' })
  await Promise.all([item.click(), item.click().catch(() => {})])

  await expect(page.getByTestId('activity-entry')).toHaveCount(before + 1)
})
```

Counting activity entries is the right assertion. Asserting that the button was disabled would test the mitigation; asserting that one entry was created tests the outcome, and would still pass if the mechanism changed.

### Test data

E2E tests run against the deterministic seed, so fixed references like `SR-2026-000142` exist reliably. Tests that mutate data operate on a reserved block of records (`SR-2026-0009xx`) that no read-only test asserts against, so specs can run in parallel without interfering.

Each spec authenticates via a stored session state rather than driving the login form, except `auth.spec.ts` which tests login itself. Repeating a login in twelve specs is twelve slow, redundant tests of the same thing.

## What is deliberately not tested

Naming these is part of the strategy — an untested area that nobody decided about is a gap; one that was reasoned about is a boundary.

- **Vendored `components/ui/**`.** Base UI behaviour is tested upstream. Our composition of it is covered where it is used.
- **Framework behaviour.** Whether Next.js streams a Suspense boundary correctly is not this application's test to write. That PPR *is* producing a shell is asserted once, in `dashboard.spec.ts`.
- **Drizzle query generation.** Covered transitively by integration tests against a real database.
- **Visual regression.** Would add real value, but needs a screenshot baseline and review workflow that is disproportionate here. Noted as an extension.
- **Load testing.** The pagination and index-plan assertions cover the scale claims. Throughput testing would need infrastructure the brief rules out.

## No MSW

Mock Service Worker is a good tool for an application that fetches from HTTP APIs in the browser. This one does not — reads are Server Components querying a database directly, and writes are Server Actions. There is no client-side HTTP traffic to intercept.

Where a boundary genuinely needs stubbing, the right seam is used instead: `vi.mock` on the action module for component tests, and `page.route` in Playwright for network-failure simulation. Introducing MSW here would mean building an HTTP layer solely so it could be mocked.

## Commands

```jsonc
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "typecheck": "next typegen && tsc --noEmit",
  "lint": "eslint .",
  "knip": "knip",
  "verify": "pnpm typecheck && pnpm lint && pnpm knip && pnpm test:run && pnpm build && pnpm test:e2e"
}
```

`typecheck` runs `next typegen` first because the global route type helpers (`PageProps<'/requests/[id]'>`, `LayoutProps`, `RouteContext`) are generated, not imported. Running `tsc` without generating them first fails on types that are actually fine. This is a Next.js 16 detail that costs an afternoon if you do not know it.

`verify` is the single command CI runs, in dependency order — types, lint, dead-code check, unit, build, then E2E against the build. Workflow definition: [15 · Local setup](./15-local-setup.md#ci-workflow).

Engineering standards (AAA, factories, isolation, POM, flakiness rules): [16 · Test guidelines](./16-test-guidelines.md).
