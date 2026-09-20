# 16 · Test Guidelines

Production-ready engineering standards for the **As-Sunnah Desk** test suite. These rules sit **below** [09 · Testing strategy](./09-testing-strategy.md) (what to test) and **above** individual spec files (how each case is written).

Stack context: **Vitest 5**, **React Testing Library**, **Playwright 1.63**, **TypeScript strict**, **Next.js 16 App Router**, **Drizzle ORM**, **SQLite via libSQL**. Read [02 · Tech stack decisions](./02-tech-stack-decisions.md) for version pins.

---

## Purpose

This document enforces:

1. **Predictable structure** — every test reads the same way (Arrange–Act–Assert).
2. **Real boundaries** — integration tests hit a real database, not mocked repositories.
3. **Zero leakage** — timers, mocks, network, and state never bleed between tests or workers.
4. **Zero flakiness** — no time-based waits; assertions drive synchronization.
5. **Parallel safety** — specs can run concurrently without order dependence.

If a rule here conflicts with a one-off shortcut in a spec, **the rule wins**. Update the spec.

---

## Test taxonomy and layout

```
src/test/
├── setup.ts                 # Vitest global setup (RTL matchers, MSW lifecycle)
├── db.ts                    # Ephemeral SQLite factory
├── factories/               # Builder functions — never static fixture JSON
│   ├── user.factory.ts
│   ├── request.factory.ts
│   └── index.ts
├── helpers/
│   ├── render.tsx           # RTL wrapper with providers
│   ├── session.ts           # iron-session test helpers
│   └── contracts.ts         # Zod contract assertions
├── mocks/
│   ├── handlers.ts          # MSW handlers (external HTTP only)
│   └── server.ts            # setupServer for Node/Vitest
└── e2e/
    ├── .auth/               # storageState JSON (gitignored, CI-generated)
    ├── fixtures/            # Playwright test.extend fixtures
    ├── pages/               # Page Object Model classes
    ├── global-setup.ts      # DB seed + session bootstrap via API
    └── global-teardown.ts

src/**/*.test.ts             # Unit + integration (co-located or mirrored)
src/**/*.spec.tsx            # Component tests (sync Client Components only)
src/test/e2e/**/*.spec.ts    # Playwright E2E
```

| Layer | Runner | Environment | Real I/O |
|---|---|---|---|
| Unit | Vitest | `node` or `jsdom` | None |
| Integration | Vitest | `node` | In-memory SQLite |
| Component | Vitest | `jsdom` | None (actions mocked at module boundary) |
| E2E | Playwright | Chromium | Production build + seeded SQLite file |

Strategy and coverage targets: [09 · Testing strategy](./09-testing-strategy.md).

---

## Global non-negotiables

These apply to **every** layer.

### Ban explicit time waits

| Forbidden | Required instead |
|---|---|
| `await page.waitForTimeout(n)` | Playwright web-first assertions: `toBeVisible()`, `toHaveText()`, … |
| `await new Promise(r => setTimeout(r, n))` | `waitFor(() => …)` (RTL) or `vi.waitFor()` (Vitest) |
| `sleep(n)` / `delay(n)` helpers | Advance fake timers: `vi.advanceTimersByTime(n)` |
| Polling loops with fixed `setInterval` | Assertion retries built into the runner |

Playwright and RTL already retry until timeout. Adding sleep hides race conditions and makes CI non-deterministic.

### Parallel-safe isolated state

- Vitest runs test files in parallel workers by default. **Never share mutable module-level state** between tests.
- Integration: one `:memory:` database **per describe block** (or per `test.extend` fixture scope), not one global singleton.
- E2E: mutate only records in the reserved block (`SR-2026-0009xx`). Read-only specs use the deterministic seed (`SR-2026-000142`, etc.).
- E2E auth: use `storageState` fixtures — never log in through the UI except in `auth.spec.ts`.

### Locator policy (E2E and component tests)

**Allowed**

- `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText` (accessible names)
- `getByTestId('…')` for elements without a stable accessible name

**Forbidden**

- CSS selectors: `.class`, `#id`, `[data-state=…]`
- XPath
- DOM structure paths: `div > span:nth-child(3)`
- `page.locator('text=…')` when a role query works

Add `data-testid` in production components only when no semantic role exists. Prefer roles first — see [08 · UI states and accessibility](./08-ui-states-and-accessibility.md).

### Network isolation

| Layer | External HTTP |
|---|---|
| Unit | Not applicable — no I/O |
| Integration | **Blocked.** `undici`/`fetch` must not reach the public internet. Use MSW Node (`setupServer`) or `vi.stubGlobal('fetch', …)` for any outbound HTTP the code under test performs. |
| E2E | **Blocked** for third parties. Use `page.route()` or MSW in `globalSetup` for anything outside `localhost`. Server Actions and RSC payloads stay real — do not mock the app's own routes unless simulating failure. |

> **Note on MSW in this codebase.** Most reads and writes never touch client-side HTTP — Server Components query SQLite directly and mutations are Server Actions. MSW is still mandatory wherever an HTTP client boundary exists (webhooks, future integrations, `route.ts` proxies). For Server Action failure simulation in E2E, use Playwright `page.route()` as shown in [09 · Testing strategy](./09-testing-strategy.md#layer-4--end-to-end-tests).

---

## Layer 1 · Unit tests

**Scope:** `lib/**`, state machines, search-param parsing, formatters, hooks (with jsdom), permission maps. No database, no network, no Next.js request context.

### AAA pattern (mandatory)

Every `it` block follows **Arrange → Act → Assert**. Use blank lines or comments to mark the three sections. One logical assertion cluster per test; multiple `expect` calls on the same outcome are fine.

```ts
import { describe, it, expect } from 'vitest'
import { canTransition } from '@/lib/request-status'

describe('canTransition', () => {
  it('allows new → in_review', () => {
    // Arrange
    const from = 'new' as const
    const to = 'in_review' as const

    // Act
    const allowed = canTransition(from, to)

    // Assert
    expect(allowed).toBe(true)
  })

  it('rejects closed → any', () => {
    // Arrange
    const from = 'closed' as const
    const to = 'new' as const

    // Act
    const allowed = canTransition(from, to)

    // Assert
    expect(allowed).toBe(false)
  })
})
```

**Reject** tests that interleave setup and assertions, or that assert before the act completes.

### Dynamic factories and builders

Never commit large static JSON blobs. Use **builder functions** with typed overrides and sensible defaults via `@faker-js/faker`.

```ts
// src/test/factories/request.factory.ts
import { faker } from '@faker-js/faker'
import type { InferInsertModel } from 'drizzle-orm'
import { serviceRequests } from '@/server/db/schema'

export type RequestInsert = InferInsertModel<typeof serviceRequests>
export type RequestOverrides = Partial<RequestInsert>

export function buildRequest(overrides: RequestOverrides = {}): RequestInsert {
  const seq = faker.string.numeric(6)
  return {
    id: overrides.id ?? `req_${faker.string.uuid()}`,
    reference: overrides.reference ?? `SR-2026-${seq}`,
    title: overrides.title ?? faker.lorem.sentence(),
    status: overrides.status ?? 'new',
    priority: overrides.priority ?? 'medium',
    categoryId: overrides.categoryId ?? 'cat_general',
    requesterId: overrides.requesterId ?? 'user_viewer',
    assigneeId: overrides.assigneeId ?? null,
    version: overrides.version ?? 1,
    createdAt: overrides.createdAt ?? new Date('2026-01-15T10:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  }
}

/** Fluent builder when a test needs several mutations in sequence. */
export class RequestBuilder {
  private data: RequestInsert

  constructor(base: RequestOverrides = {}) {
    this.data = buildRequest(base)
  }

  withStatus(status: RequestInsert['status']): this {
    this.data.status = status
    return this
  }

  withAssignee(assigneeId: string): this {
    this.data.assigneeId = assigneeId
    return this
  }

  build(): RequestInsert {
    return { ...this.data }
  }
}
```

Rules:

- Factories live in `src/test/factories/`, not inside spec files.
- Each factory exports `buildX()`; export `insertX(db, overrides)` only in integration helpers.
- Overrides are `Partial<T>` — never `any`.
- Use **fixed dates** when time boundaries matter; use `faker` for bulk volume tests.

### Strict dependency injection and mocking

Dependencies enter through **constructor parameters, function arguments, or module seams** — never hard-coded globals inside the unit under test.

| Dependency | Mock strategy |
|---|---|
| Pure function | No mocks |
| Module with side effects | `vi.mock('@/server/…', () => ({ … }))` at boundary only |
| Clock | `vi.useFakeTimers()` |
| Randomness | Inject seed or stub `Math.random` |
| Environment | `vi.stubEnv('KEY', 'value')` — always unstub in `afterEach` |

**Mock at the boundary, not the leaf.** If testing `RequestService.updateStatus`, inject a real in-memory DB in integration tests; in a pure unit test for a helper, pass a stub repository interface:

```ts
import { describe, it, expect, vi } from 'vitest'
import type { RequestRepository } from '@/server/repositories/request.repository'
import { createIdempotencyGuard } from '@/server/services/idempotency'

describe('createIdempotencyGuard', () => {
  it('returns cached result for duplicate key', async () => {
    // Arrange
    const findByKey = vi.fn<RequestRepository['findActivityByIdempotencyKey']>()
      .mockResolvedValue({ id: 'act_1', requestId: 'req_1' })
    const repo: Pick<RequestRepository, 'findActivityByIdempotencyKey'> = { findByKey }
    const guard = createIdempotencyGuard(repo)

    // Act
    const result = await guard('key-abc', async () => ({ id: 'act_new' }))

    // Assert
    expect(result).toEqual({ id: 'act_1', requestId: 'req_1' })
    expect(findByKey).toHaveBeenCalledWith('key-abc')
  })
})
```

Use `vi.hoisted()` when mock factories must run before `vi.mock` hoisting:

```ts
const { mockRequireUser } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
}))

vi.mock('@/server/auth/dal', () => ({
  requireUser: mockRequireUser,
}))
```

### Fake timers

Required for debounce, rate-limit windows, and session expiry logic.

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('fires once after 300 ms of quiet', () => {
    // Arrange
    const fn = vi.fn<(value: string) => void>()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))

    // Act
    act(() => {
      result.current('a')
      result.current('ab')
      vi.advanceTimersByTime(299)
    })
    expect(fn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Assert
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('ab')
  })
})
```

### Zero-leakage `afterEach` cleanup

Every spec file that uses mocks, timers, env stubs, or DOM **must** reset state:

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
```

Per-file additions when needed:

```ts
afterEach(async () => {
  await mswServer.resetHandlers()
})
```

Checklist — all must be false after every test:

- [ ] Pending timers
- [ ] Active `vi.mock` call history affecting other tests
- [ ] Stubbed env vars
- [ ] MSW handlers added via `server.use()` in the test body
- [ ] DOM nodes from RTL `render()`

---

## Layer 2 · Integration tests

**Scope:** `server/repositories/**`, `server/services/**`, password hashing, rate limiter. **Real SQLite, no repository mocks.**

### Ephemeral database instances

This project uses **libSQL in-memory SQLite** — no Docker required. Each suite gets a fresh database migrated from `drizzle/`. This satisfies the "containerized or isolated schema" rule: isolation is per-instance, not per shared file.

```ts
// src/test/db.ts
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from '@/server/db/schema'

export type TestDb = LibSQLDatabase<typeof schema>

export interface TestDbContext {
  db: TestDb
  client: Client
  dispose: () => Promise<void>
}

export async function createTestDb(): Promise<TestDbContext> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })

  return {
    db,
    client,
    dispose: async () => {
      client.close()
    },
  }
}
```

Vitest fixture extension (preferred for parallel safety):

```ts
// src/test/db.fixture.ts
import { test as base } from 'vitest'
import { createTestDb, type TestDbContext } from './db'

export const test = base.extend<{ dbContext: TestDbContext }>({
  dbContext: async ({}, use) => {
    const ctx = await createTestDb()
    await use(ctx)
    await ctx.dispose()
  },
})

export { expect } from 'vitest'
```

Usage:

```ts
import { test, expect } from '@/test/db.fixture'
import { insertRequest } from '@/test/factories/request.factory'
import { listPaged } from '@/server/repositories/request.repository'

test('paginates without duplicates', async ({ dbContext: { db } }) => {
  // Arrange
  await insertRequests(db, 500)

  // Act
  const seen = new Set<string>()
  let cursor: string | null = null
  do {
    const page = await listPaged(db, { /* filters */ }, cursor, 25)
    for (const row of page.items) {
      expect(seen.has(row.id)).toBe(false)
      seen.add(row.id)
    }
    cursor = page.nextCursor
  } while (cursor)

  // Assert
  expect(seen.size).toBe(500)
})
```

> **PostgreSQL / Testcontainers path.** If `DATABASE_URL` switches to Postgres, replace `createTestDb` with `@testcontainers/postgresql` and run migrations inside the container. Keep the same fixture API so specs do not change. See [02 · Tech stack decisions](./02-tech-stack-decisions.md#data-layer).

### Transactional rollback strategy

Two valid patterns — pick one per suite, never mix:

| Pattern | When | Mechanism |
|---|---|---|
| **Fresh DB** (default here) | SQLite `:memory:` | New `createTestDb()` per describe/fixture — discard on `dispose()` |
| **Rollback wrapper** | File-backed or shared Postgres | `BEGIN` → run test → `ROLLBACK` in `afterEach` |

Rollback example (Postgres or file SQLite):

```ts
import { sql } from 'drizzle-orm'
import { afterEach, beforeEach, describe, it } from 'vitest'

describe('RequestService', () => {
  let db: TestDb

  beforeEach(async () => {
    db = (await createTestDb()).db
    await db.execute(sql`BEGIN`)
  })

  afterEach(async () => {
    await db.execute(sql`ROLLBACK`)
  })

  it('creates activity on status change', async () => {
    // Arrange / Act / Assert — all changes rolled back automatically
  })
})
```

Never commit inside a rollback-wrapped test unless explicitly testing commit semantics.

### Contract validation

Integration tests assert **Zod schema contracts** at trust boundaries — the same schemas production uses.

```ts
// src/test/helpers/contracts.ts
import { expect } from 'vitest'
import type { ZodType } from 'zod'

export function expectValid<T>(schema: ZodType<T>, value: unknown): asserts value is T {
  const result = schema.safeParse(value)
  expect(result.success, JSON.stringify(result.success ? '' : result.error.flatten())).toBe(true)
}
```

```ts
import { requestListItemSchema } from '@/features/requests/schemas'
import { expectValid } from '@/test/helpers/contracts'

it('list rows satisfy the public contract', async ({ dbContext: { db } }) => {
  const { items } = await listPaged(db, defaultFilters, null, 10)
  for (const item of items) {
    expectValid(requestListItemSchema, item)
  }
})
```

URL round-trips use the same schemas as [04 · Data model and scale](./04-data-model-and-scale.md#url-filter-identifiers):

```ts
import { searchParamsSchema } from '@/lib/search-params/schema'

it('serialise → parse is identity for valid filters', () => {
  const input = { status: ['new', 'in_progress'], sort: 'created_desc' as const }
  const serialised = serialiseSearchParams(input)
  const parsed = searchParamsSchema.parse(Object.fromEntries(new URLSearchParams(serialised)))
  expect(parsed).toEqual(expect.objectContaining(input))
})
```

### MSW and WireMock for outbound HTTP

Integration tests **must not** hit external networks. Configure MSW in Node for Vitest:

```ts
// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const mswServer = setupServer(...handlers)
```

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.example.com/webhook-status', () => {
    return HttpResponse.json({ ok: true })
  }),
]
```

```ts
// src/test/setup.ts (append)
import { beforeAll, afterAll, afterEach } from 'vitest'
import { mswServer } from './mocks/server'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
```

`onUnhandledRequest: 'error'` fails the test if production code attempts an unmocked outbound call.

For JVM-side stubs in polyglot setups, **WireMock** standalone is acceptable — same rule: no unmocked external traffic. Prefer MSW in this TypeScript repo.

---

## Layer 3 · Component tests (sync Client Components only)

Vitest does **not** support async Server Components ([09](./09-testing-strategy.md)). Component tests target sync Client Components: `StatusControl`, `SearchInput`, `LoginForm`, etc.

- Use `render()` from `@/test/helpers/render.tsx` (providers, router stub).
- Mock Server Actions at the **module boundary** with `vi.mock`:
  `vi.mock('@/features/requests/actions/update-status', () => ({ updateStatus: vi.fn() }))`.
- Run `jest-axe` in every component spec.
- Follow the same AAA, factory, and `afterEach` rules as unit tests.

---

## Layer 4 · End-to-end tests

**Scope:** Async Server Components, navigation, optimistic updates, accessibility journeys. Runs against `next build && next start` — see [09 · Testing strategy](./09-testing-strategy.md#layer-4--end-to-end-tests).

### Page Object Model (mandatory)

All selectors and page actions live in `src/test/e2e/pages/`. Spec files contain **scenario orchestration only** — no raw locators in specs.

```ts
// src/test/e2e/pages/requests.page.ts
import type { Page, Locator } from '@playwright/test'

export class RequestsPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly resultCount: Locator
  readonly activeFilters: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByRole('searchbox', { name: /search requests/i })
    this.resultCount = page.getByTestId('result-count')
    this.activeFilters = page.getByTestId('active-filter')
  }

  async goto(query = ''): Promise<void> {
    await this.page.goto(`/requests${query}`)
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
  }

  statusBadge(reference: string): Locator {
    return this.page
      .getByRole('row', { name: new RegExp(reference) })
      .getByTestId('status-badge')
  }
}
```

```ts
// src/test/e2e/pages/request-detail.page.ts
import type { Page, Locator } from '@playwright/test'

export class RequestDetailPage {
  readonly page: Page
  readonly statusBadge: Locator
  readonly activityEntries: Locator
  readonly statusTrigger: Locator

  constructor(page: Page) {
    this.page = page
    this.statusBadge = page.getByTestId('status-badge')
    this.activityEntries = page.getByTestId('activity-entry')
    this.statusTrigger = page.getByRole('button', { name: /status/i })
  }

  async goto(reference: string): Promise<void> {
    await this.page.goto(`/requests/${reference}`)
  }

  async changeStatus(label: string | RegExp): Promise<void> {
    await this.statusTrigger.click()
    await this.page.getByRole('menuitem', { name: label }).click()
  }
}
```

```ts
// src/test/e2e/requests/search.spec.ts
import { test, expect } from '@/test/e2e/fixtures'
import { RequestsPage } from '@/test/e2e/pages/requests.page'

test.describe('search', () => {
  test('debounced search updates the URL', async ({ adminPage: page }) => {
    const requests = new RequestsPage(page)

    // Arrange
    await requests.goto()

    // Act
    await requests.search('network outage')

    // Assert
    await expect(page).toHaveURL(/q=network/)
    await expect(requests.resultCount).not.toHaveText(/12,?000/)
  })
})
```

### API-driven state setup (no UI login)

Authenticate once in `global-setup.ts`. Store `storageState` per role. Specs use fixtures — **never** the login form except in `auth.spec.ts`.

```ts
// src/test/e2e/global-setup.ts
import { chromium, type FullConfig } from '@playwright/test'
import path from 'node:path'

const authDir = path.join(__dirname, '.auth')

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Seed DB (reuse db:seed script or a slim E2E seed)
  await seedE2eDatabase()

  const browser = await chromium.launch()
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://127.0.0.1:3000'

  for (const [role, credentials] of Object.entries(E2E_ACCOUNTS)) {
    const context = await browser.newContext()
    const page = await context.newPage()

    // API/session bootstrap — faster and more stable than UI login
    await page.request.post(`${baseURL}/api/test/session`, {
      data: { email: credentials.email, password: credentials.password },
    })

    await context.storageState({ path: path.join(authDir, `${role}.json`) })
    await context.close()
  }

  await browser.close()
}
```

```ts
// src/test/e2e/fixtures/index.ts
import { test as base, type Page } from '@playwright/test'
import path from 'node:path'

type RoleFixtures = {
  adminPage: Page
  agentPage: Page
}

export const test = base.extend<RoleFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/admin.json'),
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
  agentPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/agent.json'),
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
```

Test credentials: [15 · Local setup](./15-local-setup.md#test-accounts).

For mutating scenarios, prefer **API setup** over UI navigation:

```ts
test.beforeEach(async ({ adminPage }) => {
  await adminPage.request.post('/api/test/requests', {
    data: { reference: 'SR-2026-000901', status: 'new' },
  })
})
```

The `/api/test/*` routes exist only when `NODE_ENV=test` and are stripped from production builds.

### Network mocking for third-party services

Use `page.route()` for failure injection on Server Actions. Use the same for external SaaS endpoints:

```ts
test('surfaces an error when the webhook provider is down', async ({ adminPage: page }) => {
  await page.route('https://hooks.example.com/**', (route) => route.abort('failed'))

  const detail = new RequestDetailPage(page)
  await detail.goto('SR-2026-000142')
  await detail.changeStatus(/in review/i)

  await expect(page.getByRole('alert')).toContainText(/could not/i)
})
```

Block all non-local traffic in `playwright.config.ts` as a safety net:

```ts
// playwright.config.ts (excerpt)
use: {
  baseURL: 'http://127.0.0.1:3000',
},
```

```ts
// src/test/e2e/fixtures/index.ts (network guard fixture)
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
        return route.continue()
      }
      return route.abort('blockedbyclient')
    })
    await use(page)
  },
})
```

Remove the guard in specs that intentionally mock a specific external host with a narrower `page.route`.

### Assertion-driven waiting (E2E)

```ts
// Correct — Playwright auto-waits
await expect(detail.statusBadge).toHaveText('In review')
await expect(detail.activityEntries).toHaveCount(before + 1)

// Wrong — never do this
await page.waitForTimeout(500)
await expect(detail.statusBadge).toHaveText('In review')
```

For navigation:

```ts
await Promise.all([
  page.waitForURL(/\/requests\/SR-2026-/),
  page.getByRole('link', { name: 'SR-2026-000142' }).click(),
])
```

---

## Flakiness prevention checklist

Use this in code review for every new spec.

| # | Check |
|---|---|
| 1 | AAA sections visible or clearly separated |
| 2 | No `waitForTimeout`, `sleep`, or bare `setTimeout` for synchronization |
| 3 | Factories used — no 50-line inline object literals |
| 4 | `afterEach` / fixture teardown clears mocks, timers, MSW handlers, DOM |
| 5 | Integration test uses real DB — no `vi.mock` on repositories |
| 6 | E2E locators are role or `data-testid` only |
| 7 | E2E auth via `storageState`, not login form |
| 8 | Mutations target `SR-2026-0009xx` or API-created records |
| 9 | External HTTP blocked or explicitly stubbed |
| 10 | Spec passes with `--repeat-each=10` locally |

Commands:

```bash
pnpm vitest run --repeat=10 src/lib/search-params/
pnpm playwright test --repeat-each=10 requests/search.spec.ts
```

---

## Anti-patterns catalog

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Shared global `db` singleton | Parallel workers race | `test.extend` fixture per scope |
| `await page.waitForTimeout(1000)` | Masks timing bugs | Web-first assertions |
| Static `fixtures/requests.json` | Drifts from schema | `buildRequest()` factory |
| Mocking `listPaged` in service tests | Tests the mock, not SQL | Integration test against SQLite |
| CSS selector `.status-badge` | Breaks on Tailwind refactor | `getByTestId('status-badge')` |
| UI login in every spec | Slow, brittle | `storageState` + global setup |
| Asserting implementation (`toHaveBeenCalledWith`) as the **only** check | Refactor breaks test without behaviour change | Assert outcome; spy is supplementary |
| Missing `vi.useRealTimers()` | Leaks into next file | Global + per-file `afterEach` |

---

## CI enforcement

Full gate: `pnpm verify` ([15 · Local setup](./15-local-setup.md#ci-workflow)).

```jsonc
// package.json (excerpt)
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "verify": "pnpm typecheck && pnpm lint && pnpm knip && pnpm test:run && pnpm build && pnpm test:e2e"
  }
}
```

Coverage thresholds (`vitest.config.ts`): lines 80%, functions 80%, branches 75%. Exclude vendored `components/ui/**`.

Recommended ESLint restrictions (add to `eslint.config.mjs` in Phase 0):

```js
// Ban explicit sleeps in test files
{
  files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='waitForTimeout']",
        message: 'Use assertion-driven auto-waiting instead of waitForTimeout.',
      },
    ],
  },
},
```

---

## Related documents

| Document | Relationship |
|---|---|
| [09 · Testing strategy](./09-testing-strategy.md) | What each layer covers |
| [03 · System architecture](./03-system-architecture.md) | Layer boundaries and `src/test/` layout |
| [08 · UI states and accessibility](./08-ui-states-and-accessibility.md) | Locator and axe requirements |
| [15 · Local setup](./15-local-setup.md) | Test accounts, CI, `verify` |
| [11 · Implementation roadmap](./11-implementation-roadmap.md) | Phase 0 test scaffolding tasks |
