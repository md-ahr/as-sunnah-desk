# 11 · Implementation Roadmap

Eight phases, ordered so that each one ends with something demonstrable and nothing is
built on an unverified foundation. The riskiest work — the Cache Components rendering
model — comes early, while there is still room to change course.

Phases 0–5 are the deliverable. Phases 6–7 are hardening.

---

## How to execute a phase in a new session

Every phase begins the same way. Do not skip the read step — the docs are the spec;
this roadmap is the schedule.

1. **Read this phase's "Before you start" table** — docs, rules, and skills in the
  order listed.
2. **Confirm upstream phases are done** — check the previous phase's **Done when**
  checklist, not just "mostly there".
3. **Work sub-tasks in order** — later tasks assume earlier ones exist. Do not jump to
  UI before the repository layer is proven.
4. **Stay inside the layer hierarchy** — routes → features → services → repositories
  → database. If you need a query, add it to a repository, not a page.
5. **Run the phase exit gate** before opening the next phase.

When an agent starts a session (e.g. "execute Phase 1"), it should announce which docs
and rules it read, then proceed task-by-task.

---



## Requirements → phase map

Each brief requirement from [01 · Requirements traceability](./01-requirements-traceability.md)
lands in exactly one primary phase. Later phases may add tests or polish, but not the
first implementation.


| Req | Brief topic                                | Primary phase                                                              | Proof (tests / checks)                                                    |
| --- | ------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| —   | Code architecture & tooling                | **0**                                                                      | ESLint layer violations fail; `pnpm verify` green                         |
| —   | Data model & scale                         | **1**                                                                      | 12k seed; `EXPLAIN QUERY PLAN`; keyset pagination test                    |
| 1   | Authentication & access                    | **2**                                                                      | `auth.spec.ts`; rate-limit unit; DAL integration                          |
| 2   | Request dashboard                          | **3**                                                                      | `dashboard.spec.ts`; column render; default page size                     |
| 3   | Search, filter & navigation                | **3**                                                                      | `search.spec.ts`, `filters.spec.ts`, `pagination.spec.ts`; URL unit tests |
| 6   | Application states (loading, empty, error) | **3** (dashboard), **4** (detail), **7** (global)                          | Component + E2E; `jest-axe`                                               |
| 7   | Performance & scale                        | **1** (queries), **3** (rendering checkpoint), **7** (bundle + Lighthouse) | Query plan; Phase 3 build checkpoint; `next experimental-analyze`         |
| 8   | Responsive UI & accessibility              | **3–5** (features), **7** (audit)                                          | `responsive.spec.ts`, `a11y.spec.ts`, keyboard journey                    |
| 4   | Request details                            | **4**                                                                      | `detail.spec.ts` — direct URL, refresh, activity, not-found               |
| 5   | Update workflow                            | **5**                                                                      | Status machine N×N; idempotency + conflict E2E                            |
| 9   | Advanced JavaScript utility                | **6**                                                                      | `lib/summarize-activity/` unit suite incl. 100k test                      |
| —   | Role-scoped access                         | **2** (permissions), **5** (enforcement in writes)                         | `access-control.spec.ts`                                                  |
| —   | Deliverables (README, technical note)      | **7**                                                                      | [12](./12-technical-note.md), [15](./15-local-setup.md)                   |


**Out of scope** (do not add during any phase): request creation, real-time push,
multi-tenancy, i18n — [01 § intentionally does not cover](./01-requirements-traceability.md#requirements-this-design-intentionally-does-not-cover).

---



## Layer build order (within every feature phase)

When a phase adds user-visible behaviour, build bottom-up:

```
schema / migration  →  repository  →  service (+ DAL)  →  feature components  →  route page
```

Routes stay thin: parse URL, compose components, place Suspense and error boundaries.
No inline queries. No business logic in `page.tsx`.

---



## Phase 0 · Foundation

**Goal:** a project that builds, lints, typechecks, formats, and enforces its own
architecture — locally, in the editor, and in git hooks — before any feature code exists.

Phase 0 is deliberately front-loaded. The assessment rewards production-minded behaviour
(layering, typed boundaries, scale claims you can prove). Wiring the guardrails first
is cheaper than retrofitting them after five phases of feature work.

### Before you start


| Read first                                                                                  | Why                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [02 · Tech stack decisions](./02-tech-stack-decisions.md)                                   | Dependency budget, rejected alternatives  |
| [03 · System architecture](./03-system-architecture.md) — dependency rule, folder structure | Layer table drives ESLint config          |
| [15 · Local setup](./15-local-setup.md)                                                     | Env vars, `db:*` scripts, CI workflow     |
| [09 · Testing strategy](./09-testing-strategy.md#commands)                                  | Vitest / Playwright / `typecheck` scripts |
| [13 · Next.js 16 reference](./13-nextjs-16-reference.md)                                    | Version-specific API facts                |
| [14 · UI component plan](./14-ui-component-plan.md#required-core-deliverable)               | shadcn init + required primitives         |



| Cursor rules                                 | Skills (when relevant)                      |
| -------------------------------------------- | ------------------------------------------- |
| `.cursor/rules/00-project.mdc` (create)      | `nextjs-best-practices`, `coding-standards` |
| `.cursor/rules/01-architecture.mdc` (create) | `new-repo` (if bootstrapping from scratch)  |
| `.cursor/rules/04-testing.mdc` (create)      | `vitest`, `playwright-skill`                |


Also read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next.js config.

### 0.1 · Project layout and Next.js config

- [x] Move `app/` → `src/app/`; update `tsconfig` paths to `@/*` → `./src/*`
- [x] Delete the starter page and unused `public/` assets
- [x] `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`,
  ```
  `typedRoutes: true`, security headers, `optimizePackageImports` for
  `lucide-react` and `@base-ui/react`
  ```
- [x] Install runtime and dev dependencies ([02 § summary](./02-tech-stack-decisions.md#summary))
- [x] `pnpm dlx shadcn@latest init --template next --base base`; confirm
  ```
  `components.json` has `"base": "base"`
  ```
- [x] Install required shadcn primitives per
  ```
  [14 · required core deliverable](./14-ui-component-plan.md#required-core-deliverable);
  mount `<Toaster />` in root layout
  ```
- [x] `src/server/env.ts` — Zod-parsed environment, imported for its side effect at startup
- [x] `src/lib/result.ts`, `src/server/errors/app-error.ts`
- [x] `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`
- [x] Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`,
  ```
  `typecheck`, `knip`, `test`, `test:run`, `test:e2e`, `db:*`, `verify`
  ```



### 0.2 · Agent context (token-optimised Cursor rules)

Keep rules **short, scoped, and link to** `docs/` for detail. One concern per file;
target under ~50 lines each so agent context stays cheap.


| File                                  | Scope                                                | Purpose                                                                                                                |
| ------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `.cursor/rules/00-project.mdc`        | `alwaysApply: true`                                  | Stack (Next 16, React 19, SQLite, shadcn/Base UI), assessment constraints, link to `docs/README.md`                    |
| `.cursor/rules/01-architecture.mdc`   | `src/**/*`                                           | Layer dependency rule from [03](./03-system-architecture.md#the-dependency-rule); routes thin; DAL on every read/write |
| `.cursor/rules/02-nextjs-rsc.mdc`     | `src/app/**`, `src/features/**`                      | No top-level `await` in layouts; `searchParams` as a promise inside Suspense; Server Components by default             |
| `.cursor/rules/03-server-actions.mdc` | `src/features/**/actions/**`                         | Four-step preamble; return `Result` not throw; idempotency + version checks                                            |
| `.cursor/rules/04-testing.mdc`        | `**/*.{test,spec}.{ts,tsx}`, `src/test/e2e/**`       | Unit for pure logic; integration against real SQLite; Playwright for async RSC — see [09](./09-testing-strategy.md)    |
| `.cursor/rules/05-ui-a11y.mdc`        | `src/components/**`, `src/features/**/components/**` | Semantic HTML, keyboard, no colour-only status; shadcn Base UI `render` not `asChild`                                  |


- [x] Create the rule files above; extend `AGENTS.md` with a short **project** block
  ```
  (architecture one-liner, `pnpm verify`, pointer to `docs/`) — keep the Next.js
  block `next dev` generates
  ```
- [x] Optional: `.cursor/skills/portal/SKILL.md` — indexes `docs/` by phase; do **not**
  ```
  duplicate full doc content
  ```

**Rejected:** one giant always-on rule file; copying all of `docs/` into rules.

### 0.3 · ESLint (production-grade, flat config)

Build on `eslint-config-next` and turn strictness up where it earns its keep. Prettier
owns formatting; ESLint owns correctness.

- [x] `eslint.config.mjs` — extend `eslint-config-next/core-web-vitals` +
  ```
  `typescript-eslint` **strict-type-checked**
  ```
- [x] `eslint-plugin-jsx-a11y` — explicit recommended rules
- [x] `import/no-restricted-paths` — encode every row of the layer table from
  ```
  [03 § dependency rule](./03-system-architecture.md#the-dependency-rule)
  ```
- [x] `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `await-thenable`,
  ```
  `require-await`
  ```
- [x] `@typescript-eslint/consistent-type-imports` with `prefer: 'type-imports'`
- [x] `import/no-cycle`
- [x] `no-console` — `warn`, allow `console.warn` / `console.error` only
- [x] `eslint-config-prettier` — **last** in the config array
- [x] `server-only` convention: every file under `src/server/` imports `'server-only'`;
  ```
  ESLint override in `src/app/**` and client files blocking `@/server/db` and
  `@/server/repositories`
  ```



### 0.4 · Prettier, EditorConfig, and VS Code

- [x] `prettier.config.mjs` — `singleQuote`, `semi: false`, `trailingComma: 'all'`,
  ```
  `printWidth: 100`
  ```
- [x] `prettier-plugin-tailwindcss`
- [x] `.prettierignore` — `.next`, `drizzle/meta`, `pnpm-lock.yaml`,
  ```
  `src/components/ui/**` (optional)
  ```
- [x] `.editorconfig` — `utf-8`, `lf`, `indent_size = 2`, `insert_final_newline = true`
- [x] `.vscode/settings.json` — format on save, ESLint fix on save, workspace TS SDK
- [x] `.vscode/extensions.json` — ESLint, Prettier, Tailwind CSS IntelliSense, Playwright,
  ```
  EditorConfig
  ```



### 0.5 · Git hooks (Lefthook)

Use **Lefthook** (not Husky) — fast, YAML-configured, no `npx` shim per hook.


| Hook           | Commands                           | Rationale                                       |
| -------------- | ---------------------------------- | ----------------------------------------------- |
| **pre-commit** | `lint-staged`                      | Fast; only touches staged files                 |
| **pre-push**   | `pnpm typecheck` + `pnpm test:run` | Catches type and unit regressions before remote |
| **commit-msg** | *(optional)* `commitlint`          | Skip unless you want conventional commits       |


- [x] `lefthook install` documented in README setup
- [x] `.github/workflows/verify.yml` — runs `pnpm verify` on push/PR
  ```
  ([15 § CI workflow](./15-local-setup.md#ci-workflow))
  ```
- [x] `pnpm verify` = `typecheck` → `lint` → `knip` → `test:run` → `build` →
  ```
  `test:e2e` — full gate in CI and before submission; **not** on every commit
  ```



### 0.6 · TypeScript (strict compiler options)

- [x] `"strict": true`, `"noUncheckedIndexedAccess": true`, `"verbatimModuleSyntax": true`
- [x] `"paths": { "@/*": ["./src/*"] }`, Next plugin, `"moduleResolution": "bundler"`
- [x] `tsconfig.test.json` — Vitest globals, `src/test/**`
- [x] `typecheck` script: `next typegen && tsc --noEmit`
- [x] `@typescript-eslint/explicit-module-boundary-types` on `src/server/**` and
  ```
  `src/features/**/actions/**` only
  ```



### 0.7 · Dead code and dependency hygiene (Knip)

- [x] `knip` + `knip.json` — Next.js plugin, explicit entry points for scripts and configs
- [x] `ignore`: `src/components/ui/**`, `.next/**`, `drizzle/meta/**`
- [x] Include `pnpm knip` in `pnpm verify` after `lint`, before `test:run`



### 0.8 · Repository hygiene

- [x] `.nvmrc` or `"engines": { "node": ">=22" }`
- [x] `.npmrc`: `strict-peer-dependencies=true`
- [x] `.env.example` per [15 § environment variables](./15-local-setup.md#environment-variables)
- [x] `db:*` scripts per [15 § database scripts](./15-local-setup.md#database-scripts)
- [x] `README.md` stub: prerequisites, `pnpm install`, `lefthook install`, `db:migrate`,
  ```
  `db:seed`, test credentials, `pnpm verify`
  ```



### Done when

- [x] `pnpm verify` passes on an empty application
- [x] A layer-boundary import **fails ESLint** with a clear message
- [x] Format-on-save and Lefthook pre-commit / pre-push work
- [x] Cursor rules are active; agent can link to `docs/` by phase

---



## Phase 1 · Data layer

**Goal:** a seeded 12,000-row database with queries proven to use indexes.

**Requirements:** data model & scale foundation for Req 2–5, 7 (see [01 §7](./01-requirements-traceability.md#7-performance--scale)).

### Before you start


| Read first                                                                                             | Why                          |
| ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| [04 · Data model and scale](./04-data-model-and-scale.md) — entity model, indexes, pagination, seeding | Owns schema and query shape  |
| [03 · System architecture](./03-system-architecture.md) — repositories layer                           | DTO boundaries, folder paths |
| [09 · Testing strategy](./09-testing-strategy.md#layer-2--integration-tests)                           | Integration test scope       |
| [16 · Test guidelines](./16-test-guidelines.md#layer-2--integration-tests)                             | Factories, isolation, AAA    |
| [15 · Local setup](./15-local-setup.md#database-scripts)                                               | `db:migrate`, `db:seed`      |



| Cursor rules          | Skills                              |
| --------------------- | ----------------------------------- |
| `01-architecture.mdc` | `vitest`, `test-driven-development` |


Do **not** read UI or rendering docs yet — no routes in this phase.

### 1.1 · Schema and migrations

- [ ] `src/server/db/schema.ts` — tables, enums, indexes, `priority_rank` generated column
- [ ] Drizzle Kit config at repo root; initial migration committed
- [ ] FTS5 virtual table + sync triggers as a separate migration
- [ ] `src/server/db/types.ts` — inferred row / insert types exported for repositories



### 1.2 · Database client

- [ ] `src/server/db/client.ts` — libSQL + Drizzle singleton (module-scoped; survives HMR)
- [ ] Import `'server-only'`; no client or route imports



### 1.3 · Seed

- [ ] `src/server/db/seed.ts` — deterministic, batched in one transaction, realistic distributions
- [ ] `package.json` scripts: `db:generate`, `db:migrate`, `db:seed`, `db:reset`
- [ ] Target: 12,000 `service_requests`, ~48,000 activity rows, four credentialed users



### 1.4 · Repositories (read paths only)

Build in dependency order — reference data before requests:

- [ ] `src/server/repositories/reference.repository.ts` — categories, assignable users (narrow DTOs)
- [ ] `src/server/repositories/user.repository.ts` — by id / email for auth (Phase 2)
- [ ] `src/server/repositories/request.repository.ts` — list + get-by-reference; FTS or LIKE fallback
- [ ] `src/server/repositories/activity.repository.ts` — timeline by request id

Each repository: explicit return types, selected columns only, no password hashes in DTOs
([18 § authorization patterns](./18-security-guidelines.md#authorization-patterns)).

### 1.5 · Keyset pagination utilities

- [ ] `src/lib/search-params/cursor.ts` — encode / decode cursor tokens
- [ ] Whitelisted sort map in repository or `src/lib/search-params/` (full URL contract lands in Phase 3)
- [ ] Predicate builder for `(sort_key, id)` tuple comparison



### 1.6 · Integration tests

- [ ] Test factories in `src/test/factories/` per [16 § factories](./16-test-guidelines.md#layer-2--integration-tests)
- [ ] 12,000-row keyset pagination — no gaps, no duplicates under concurrent insert simulation
- [ ] `EXPLAIN QUERY PLAN` assertion — list query must not `SCAN service_requests`
- [ ] FTS search returns expected matches (or document LIKE fallback)



### Done when

- [ ] `pnpm db:seed` completes in under 30 seconds
- [ ] Every list query plan is index-backed
- [ ] Integration suite green; no routes or UI exist yet

**Risk:** FTS5 triggers are fiddly. Ship `subject LIKE` behind the same repository
function and revisit — the interface does not change.

---



## Phase 2 · Authentication

**Goal:** working login / logout with the Data Access Layer in place.

**Requirements:** [01 §1 Authentication & access](./01-requirements-traceability.md#1-authentication--access);
role capabilities used from Phase 3 onward.

### Before you start


| Read first                                                                                   | Why                       |
| -------------------------------------------------------------------------------------------- | ------------------------- |
| [06 · Auth and security](./06-auth-and-security.md) — sessions, DAL, proxy, rate limit       | Primary auth spec         |
| [18 · Security guidelines](./18-security-guidelines.md) — auth hardening, CSRF, entry points | Server Action security    |
| [07 · Mutations](./07-mutations-and-client-state.md#the-login-form)                          | Login form pattern        |
| [14 · UI component plan](./14-ui-component-plan.md#auth-phase-2)                             | `LoginForm` primitives    |
| [05 · Rendering](./05-rendering-and-caching.md) — `use cache: private`                       | First private cache usage |
| [13 · Next.js 16 reference](./13-nextjs-16-reference.md) — `proxy.ts`                        | Replaces middleware       |



| Cursor rules                                   | Skills                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `01-architecture.mdc`, `03-server-actions.mdc` | `nextjs-app-router-patterns`, `react-hook-form-zod` (Zod only — no RHF) |


Depends on Phase 1: `user.repository.ts`, seeded accounts.

### 2.1 · Session and password

- [ ] `src/server/auth/session.ts` — iron-session seal / unseal, cookie options per
  ```
  [06 § sessions](./06-auth-and-security.md#sessions)
  ```
- [ ] `src/server/auth/password.ts` — argon2 hash and verify
- [ ] Constant-time dummy-hash path for unknown emails ([06 § login](./06-auth-and-security.md))



### 2.2 · Data Access Layer and permissions

- [ ] `src/server/auth/dal.ts` — `getCurrentUser()` with `use cache: private`;
  ```
  `requireUser()` returning `Result`
  ```
- [ ] `src/server/auth/permissions.ts` — capability map by role (agent, admin, viewer, …)
- [ ] Wire DAL into repository calls — services come in Phase 3; prove DAL with a minimal
  ```
  integration test against `user.repository`
  ```



### 2.3 · Rate limiting

- [ ] `src/server/auth/rate-limit.ts` — in-memory sliding window keyed on IP + email
- [ ] Unit test: sixth rapid failure is blocked



### 2.4 · Server Actions

- [ ] `src/features/auth/schemas/credentials.ts` — Zod schema
- [ ] `src/features/auth/actions/login.ts` — four-step preamble; return `Result`
- [ ] `src/features/auth/actions/logout.ts` — clear cookie, redirect



### 2.5 · Routes, proxy, and login UI

- [ ] `src/app/(auth)/layout.tsx` — centred auth shell
- [ ] `src/app/(auth)/login/page.tsx` + `LoginForm` Client Component
  ```
  (`input`, `label`, `button` — [14 § auth](./14-ui-component-plan.md#auth-phase-2))
  ```
- [ ] `src/proxy.ts` — optimistic cookie check, `?next=` redirect
  ```
  ([06 § proxy layer](./06-auth-and-security.md#the-proxy-layer))
  ```
- [ ] `ToasterHost` in root layout if not done in Phase 0
- [ ] Four seeded accounts documented in README ([15 § test accounts](./15-local-setup.md#seeded-test-accounts))



### 2.6 · Tests

- [ ] Unit: rate limiter, password verify, permissions map
- [ ] Integration: login success / failure, session seal round-trip
- [ ] E2E scaffold: `src/test/e2e/auth.spec.ts` — sign in, sign out, protected redirect



### Done when

- [ ] All four accounts sign in and out
- [ ] Protected URL redirects to login and returns via `?next=`
- [ ] Six rapid failed attempts are rate-limited
- [ ] Dev overlay clean after first `use cache: private` usage

---



## Phase 3 · Dashboard

**Goal:** the core screen — correct, fast, and shareable via URL.

**Requirements:** [01 §2](./01-requirements-traceability.md#2-request-dashboard),
[§3](./01-requirements-traceability.md#3-search-filter--navigation),
[§6](./01-requirements-traceability.md#6-application-states) (dashboard segment),
[§7](./01-requirements-traceability.md#7-performance--scale) (rendering),
[§8](./01-requirements-traceability.md#8-responsive-ui--accessibility) (dashboard).

### Before you start


| Read first                                                                                    | Why                           |
| --------------------------------------------------------------------------------------------- | ----------------------------- |
| [05 · Rendering and caching](./05-rendering-and-caching.md) — page composition, Suspense, PPR | Dashboard structure           |
| [07 · Mutations](./07-mutations-and-client-state.md#url-as-state)                             | URL as single source of truth |
| [04 · Data model](./04-data-model-and-scale.md#url-filter-identifiers)                        | Slug vs id in query params    |
| [08 · UI states and accessibility](./08-ui-states-and-accessibility.md)                       | Loading, empty, responsive    |
| [14 · UI component plan](./14-ui-component-plan.md#dashboard-phase-3)                         | Component checklist           |
| [17 · UI design guidelines](./17-ui-design-guidelines.md) — tokens, blocks, checklist         | Visual consistency            |
| [01 · Requirements](./01-requirements-traceability.md#2-request-dashboard)                    | Column definitions            |



| Cursor rules                          | Skills                                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `02-nextjs-rsc.mdc`, `05-ui-a11y.mdc` | `nextjs-app-router-patterns`, `shadcn-ui`, `tailwind-v4-shadcn`, `accessibility`, `frontend-design` |


Depends on Phase 1 (repositories, pagination) and Phase 2 (DAL, session).

### 3.1 · Request service (read path)

- [ ] `src/server/services/request.service.ts` — `list()` and scope filters by role
  ```
  (narrow query, never post-filter — [03 § reading the dashboard](./03-system-architecture.md#reading-the-dashboard))
  ```
- [ ] Slug → id resolution for category filter
- [ ] Facet counts query (cached in 3.6)



### 3.2 · URL contract

- [ ] `src/lib/search-params/schema.ts` — Zod URL contract (search, filters, sort, cursor, perPage)
- [ ] `src/lib/search-params/categories.ts` — slug enum
- [ ] `parse`, `serialise`, cursor helpers
- [ ] Unit tests: invalid values fall back to defaults; round-trip serialisation



### 3.3 · Portal shell

- [ ] `src/app/(portal)/layout.tsx` — app shell; session read inside Suspense-wrapped header
- [ ] `PortalHeader`, `PortalNav`, `UserMenu`, `SkipLink`
- [ ] `<main id="main">` landmark; no top-level `await`



### 3.4 · Dashboard route and table

- [ ] `src/app/(portal)/requests/page.tsx` — non-async; pass `searchParams` promise down
- [ ] `src/features/requests/request-columns.ts` — shared column defs (desktop + mobile)
- [ ] `RequestTable`, `RequestRow` — Server Components; semantic `<table>`
- [ ] `RequestTableSkeleton` — matching row geometry
- [ ] `StatusBadge`, `PriorityBadge` — read-only until Phase 5



### 3.5 · Search, filters, and pagination (client islands)

- [ ] `src/lib/hooks/use-debounced-callback.ts` — SearchInput only
  ```
  ([02 § debounced search](./02-tech-stack-decisions.md#debounced-search-timing))
  ```
- [ ] `SearchInput`, `FilterBar`, `ActiveFilterChip`, `ClearFiltersButton` — Client Components
- [ ] `popover` + `checkbox` (desktop); `sheet` (mobile filters)
- [ ] `PerPageSelect` — clears cursor on change
- [ ] `Pagination` — anchor links only (Server Component)
- [ ] `SortLink` in column headers — `aria-sort`



### 3.6 · Cached reference data

- [ ] `src/server/cache/tags.ts` — centralised tag names
- [ ] `FacetCounts` — `use cache` + `cacheTag`; categories / assignable users similarly if needed
- [ ] `ResultsLiveRegion` — announces result count changes



### 3.7 · Application states (dashboard segment)

- [ ] `EmptyState` — two variants: no data vs no filter matches
- [ ] `src/app/(portal)/requests/loading.tsx` — skeleton via `RequestTableSkeleton`
- [ ] `src/app/(portal)/requests/error.tsx` — `retry()` Client boundary



### 3.8 · Responsive layout and accessibility

- [ ] CSS: table → cards at mobile breakpoint; `data-label` pseudo-elements
- [ ] `<caption>`, `scope`, keyboard-operable filter sheet
- [ ] Component tests with `jest-axe` on `EmptyState`, filter bar



### 3.9 · Tests

- [ ] Unit: `lib/search-params/` full suite
- [ ] E2E: `dashboard.spec.ts`, `search.spec.ts`, `filters.spec.ts`, `pagination.spec.ts`
- [ ] `@axe-core/playwright` on dashboard load



### 3.10 · Build checkpoint (do not skip)

- [ ] Run `pnpm build`; confirm `/requests` reports a static shell + streaming boundaries
- [ ] If not static, fix misplaced `cookies()` / `headers()` before Phase 4



### Done when

- [ ] All eight columns render; default page size is 10
- [ ] Search debounces to a single navigation; filters compose; pasted URL reproduces view
- [ ] Layout correct at 375px, 768px, 1280px
- [ ] `jest-axe` and Playwright a11y checks clean
- [ ] Build checkpoint passed

---



## Phase 4 · Request detail

**Goal:** detail page with activity history; direct URL and refresh work.

**Requirements:** [01 §4 Request details](./01-requirements-traceability.md#4-request-details),
[§6](./01-requirements-traceability.md#6-application-states) (detail segment).

### Before you start


| Read first                                                                                           | Why                                |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [01 §4](./01-requirements-traceability.md#4-request-details)                                         | Reference in URL, not UUID         |
| [05 · Rendering](./05-rendering-and-caching.md#metadata) — `React.cache`, metadata                   | Deduped detail fetch               |
| [08 · UI states](./08-ui-states-and-accessibility.md)                                                | Detail loading / error / not-found |
| [14 · UI component plan](./14-ui-component-plan.md#request-detail-phase-4)                           | Panel + timeline components        |
| [17 · UI design guidelines](./17-ui-design-guidelines.md#5--component-composition-predefined-blocks) | Detail block layout                |



| Cursor rules                          | Skills                       |
| ------------------------------------- | ---------------------------- |
| `02-nextjs-rsc.mdc`, `05-ui-a11y.mdc` | `nextjs-app-router-patterns` |


Depends on Phase 3 (request service, auth scoping).

### 4.1 · Service and repository

- [ ] `request.service.ts` — `getByReference(reference, user)` with scope check
- [ ] `activity.repository.ts` — `listByRequestId` (if not complete in Phase 1)



### 4.2 · Detail route

- [ ] `src/app/(portal)/requests/[id]/page.tsx` — `PageProps<'/requests/[id]'>`
- [ ] `notFound()` for unknown reference and out-of-scope reference
- [ ] `prefetch={true}` on subject link in dashboard list



### 4.3 · Detail UI (read-only controls)

- [ ] `RequestDetailPanel` — all fields per [14 § detail](./14-ui-component-plan.md#request-detail-phase-4);
  ```
  status and assignee **read-only** until Phase 5
  ```
- [ ] `RequestDetailSkeleton`
- [ ] `ActivityTimeline` + `ActivityEntry` — separate Suspense boundary below panel



### 4.4 · Metadata and caching

- [ ] `generateMetadata` reusing `React.cache()`-memoised query
- [ ] No duplicate DB round-trip for metadata + page body



### 4.5 · Segment states

- [ ] `not-found.tsx`, `loading.tsx`, `error.tsx` colocated under `[id]/`



### 4.6 · Tests

- [ ] E2E: `detail.spec.ts` — cold direct URL, refresh, timeline streams, not-found



### Done when

- [ ] Direct URL and refresh preserve the view
- [ ] Timeline streams independently of panel above it
- [ ] Unknown / unauthorised reference shows not-found

---



## Phase 5 · Update workflow

**Goal:** status and assignee updates with optimistic UI, idempotency, and concurrency.

**Requirements:** [01 §5 Update workflow](./01-requirements-traceability.md#5-update-workflow),
role enforcement ([01 test matrix § role-scoped access](./01-requirements-traceability.md#test-matrix)).

### Before you start


| Read first                                                                                 | Why                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------ |
| [07 · Mutations and client state](./07-mutations-and-client-state.md) — full document      | Optimistic, idempotency, concurrency |
| [04 · Data model](./04-data-model-and-scale.md#status-state-machine)                       | Valid transitions                    |
| [06 · Auth](./06-auth-and-security.md#authorization)                                       | Capability checks on writes          |
| [18 · Security guidelines](./18-security-guidelines.md#server-entry-points--the-api-layer) | Server Action hardening              |
| [05 · Rendering](./05-rendering-and-caching.md#cache-invalidation) — `updateTag`           | Read-your-writes                     |
| [14 · UI component plan](./14-ui-component-plan.md#update-workflow-phase-5)                | Controls + toasts                    |
| [09 · Testing strategy](./09-testing-strategy.md) — update E2E list                        | Spec names                           |



| Cursor rules                                   | Skills                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `03-server-actions.mdc`, `01-architecture.mdc` | `react-state-management`, `error-handling-patterns`, `test-driven-development` |


Depends on Phase 3 (dashboard rows) and Phase 4 (detail panel).

### 5.1 · Status state machine

- [ ] `src/server/services/request-status.machine.ts` — valid transitions only
- [ ] Exhaustive N×N unit test



### 5.2 · Repository write paths

- [ ] `updateStatusIfVersionMatches` — optimistic concurrency
- [ ] `updateAssigneeIfVersionMatches` — same pattern
- [ ] Activity row insert in same transaction as update



### 5.3 · Idempotency

- [ ] `src/server/services/idempotency.ts` — store key; unique violation → "already applied"
- [ ] Integration test: replay returns original result, one activity row



### 5.4 · Request service (write path)

- [ ] Full transaction: version check → update → activity → `resolved_at` when closing
- [ ] Return typed `Result` / `AppError` codes



### 5.5 · Server Actions

- [ ] `src/features/requests/schemas/update.ts`
- [ ] `update-status.ts`, `update-assignee.ts` — four-step preamble each
- [ ] Client-generated `idempotencyKey` in payload



### 5.6 · UI controls

- [ ] `StatusControl` — dashboard row **and** detail panel; `useOptimistic` + `useTransition`
- [ ] `RowStatusControl` — thin wrapper for table cell
- [ ] `AssigneeControl` — **detail only**; `combobox` + `@tanstack/react-virtual`
- [ ] `tooltip` when `canEdit` is false
- [ ] `sonner` toasts mapped from `AppError` codes



### 5.7 · Cache invalidation

- [ ] `updateTag` / `revalidateTag` on successful write — list + detail tags
- [ ] Conflict UX: show server value + reload action



### 5.8 · Tests

- [ ] E2E: `update-status.spec.ts`, `update-assignee.spec.ts`, `update-failure.spec.ts`,
  ```
  `conflict.spec.ts`, `duplicate-submit.spec.ts`, `access-control.spec.ts`
  ```
- [ ] Integration: version mismatch, idempotency replay



### Done when

- [ ] Optimistic update visible before response; failure rolls back
- [ ] Two browser contexts → conflict, not silent overwrite
- [ ] Double-click → exactly one activity entry

This phase is worth over-investing in — largest gap between demo and production-minded work.

---



## Phase 6 · Insights and activity summary utility

**Goal:** advanced-JavaScript requirement plus a screen that uses it.

**Requirements:** [01 §9 Advanced JavaScript](./01-requirements-traceability.md#9-advanced-javascript).

### Before you start


| Read first                                                                                     | Why                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------- |
| [10 · Activity summary utility](./10-activity-summary-utility.md) — contract, algorithm, tests | Owns the utility spec        |
| [16 · Test guidelines](./16-test-guidelines.md#layer-1--unit-tests)                            | Property-style fixtures      |
| [14 · UI component plan](./14-ui-component-plan.md#insights-phase-6)                           | Insights table + collapsible |
| [03 · System architecture](./03-system-architecture.md) — `lib/` purity                        | No I/O in utility            |



| Cursor rules     | Skills                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `04-testing.mdc` | `vitest`, `test-driven-development`, `typescript-advanced-types` |


Can run in parallel with Phase 5 hardening if needed — no mutation pipeline dependency.

### 6.1 · Pure utility

- [ ] `src/lib/summarize-activity/` — types, validation, single-pass aggregation, P² quantile
- [ ] Streaming variant consuming async iterables
- [ ] No framework imports; no I/O



### 6.2 · Unit suite

- [ ] Full suite from [10 § tests](./10-activity-summary-utility.md#tests)
- [ ] 100,000-record performance test — under 250 ms, bounded heap



### 6.3 · Repository streaming

- [ ] `streamAssignmentActivity()` — cursor-based async generator in activity repository



### 6.4 · Insights route

- [ ] `src/app/(portal)/insights/page.tsx`
- [ ] `InsightsSummaryTable`, `RejectedRecordsDisclosure` (`collapsible`)
- [ ] Service wires stream → utility → DTO for table



### 6.5 · Tests

- [ ] E2E: `insights.spec.ts`
- [ ] Sync and async utility variants agree on identical fixtures



### Done when

- [ ] 100k records summarise within budget; invalid inputs reported, not dropped
- [ ] Insights page renders summary + rejected-records disclosure

---



## Phase 7 · Hardening

**Goal:** production polish, security gate, and submission artefacts.

**Requirements:** closes gaps for Req 6 (global states), 7 (bundle audit), 8 (full a11y audit),
deliverables row in [01](./01-requirements-traceability.md#deliverables).

### Before you start


| Read first                                                                                | Why                      |
| ----------------------------------------------------------------------------------------- | ------------------------ |
| [08 · UI states](./08-ui-states-and-accessibility.md#keyboard)                            | Keyboard table for audit |
| [17 · UI design guidelines](./17-ui-design-guidelines.md#7--checklist-before-shipping-ui) | Pre-ship UI checklist    |
| [18 · Security guidelines](./18-security-guidelines.md#pre-release-security-gate)         | Security gate            |
| [18 § PR checklist](./18-security-guidelines.md#pull-request-security-checklist)          | Final review             |
| [09 · Testing strategy](./09-testing-strategy.md)                                         | Full E2E matrix          |
| [16 · Test guidelines](./16-test-guidelines.md#flakiness-prevention-checklist)            | Stabilise E2E            |
| [12 · Technical note](./12-technical-note.md)                                             | Submission write-up      |
| [15 · Local setup](./15-local-setup.md)                                                   | README source of truth   |



| Cursor rules          | Skills                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| All rules — full pass | `accessibility`, `security-review`, `web-perf`, `seo-audit` (metadata only) |




### 7.1 · Global error surfaces

- [ ] `src/app/global-error.tsx`
- [ ] Root `src/app/not-found.tsx`
- [ ] `src/app/api/health/route.ts`



### 7.2 · Accessibility audit

- [ ] Focus-visible on every interactive element
- [ ] `prefers-reduced-motion` support
- [ ] Full keyboard-only journey ([08 § keyboard](./08-ui-states-and-accessibility.md#keyboard))
- [ ] Manual screen-reader pass: VoiceOver / Safari, NVDA / Firefox



### 7.3 · Performance and bundle audit

- [ ] `pnpm knip` — zero unused dependencies and orphaned source files
- [ ] `next experimental-analyze` — per-route client bundles
- [ ] Lighthouse on production build (incognito)
- [ ] Dev overlay review — instant-navigation insights



### 7.4 · Security gate

- [ ] Walk [18 § pre-release security gate](./18-security-guidelines.md#pre-release-security-gate)
- [ ] Confirm every Server Action re-verifies session ([06 § Server Actions as public endpoints](./06-auth-and-security.md#server-actions-as-public-endpoints))
- [ ] No secrets in client bundle; `.env.example` complete



### 7.5 · Documentation and submission

- [ ] Root `README.md` — prerequisites, setup, seed, credentials, scripts, troubleshooting
  ```
  (from [15](./15-local-setup.md))
  ```
- [ ] [12 · Technical note](./12-technical-note.md) reviewed against final implementation
- [ ] Extension points section accurate ([below](#extension-points))



### 7.6 · Final verification

- [ ] `pnpm verify` green on a clean clone workflow
- [ ] All E2E specs in [01 test matrix](./01-requirements-traceability.md#test-matrix) passing



### Done when

- [ ] Submission checklist in [18 § pre-release gate](./18-security-guidelines.md#pre-release-security-gate) satisfied
- [ ] README lets a reviewer run the app without asking questions

---



## Risk register


| Risk                                          | Likelihood | Impact | Response                                                                                                                        |
| --------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `cacheComponents` build errors block progress | Medium     | High   | Phase 3 §3.10 checkpoint surfaces it early. Per-segment `export const instant = false` unblocks one route                       |
| FTS5 triggers prove fiddly                    | Medium     | Low    | Ship `LIKE` fallback behind same repository function; revisit later                                                             |
| `@node-rs/argon2` has no prebuilt binary      | Low        | Medium | Swap to `bcryptjs`; one file, `src/server/auth/password.ts`                                                                     |
| React Compiler slows builds                   | Medium     | Low    | Already accepted; one-line disable                                                                                              |
| P² median harder than expected                | Low        | Low    | Report mean only; contract allows `null` median                                                                                 |
| Scope creep into request creation             | Medium     | Medium | Out of scope per [01 § does not cover](./01-requirements-traceability.md#requirements-this-design-intentionally-does-not-cover) |
| Agent skips doc read at session start         | Medium     | Medium | **Before you start** tables are mandatory; announce what was read                                                               |


The first row is the one to watch. `cacheComponents` is the highest-leverage and
highest-risk decision — which is why Phase 3 ends with a build checkpoint rather than
leaving verification to the end.

---



## Extension points

Worth noting in the README as deliberate future work rather than oversights:

- **PostgreSQL** — swap `src/server/db/client.ts`; move FTS to `tsvector`. Repository
signatures unchanged.
- **Database-backed sessions** — `sessions` table enables server-side revocation. One
function in the DAL changes.
- **Real-time updates** — SSE or polling with `refresh()`. Would justify TanStack Query.
- **Redis rate limiting** — replace in-memory limiter behind existing interface.
- **Bulk actions** — idempotency and concurrency primitives already support them; UI missing.
- **Nonce-based CSP** — if `experimental.sri` stabilises ([06 § CSP](./06-auth-and-security.md#content-security-policy)).

