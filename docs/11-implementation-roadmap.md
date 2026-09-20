# 11 · Implementation Roadmap

Eight phases, ordered so that each one ends with something demonstrable and nothing is built on an unverified foundation. The riskiest work — the Cache Components rendering model — comes early, while there is still room to change course.

Phases 0–5 are the deliverable. Phases 6–7 are hardening.

## Phase 0 · Foundation

**Goal:** a project that builds, lints, typechecks, formats, and enforces its own architecture — locally, in the editor, and in git hooks — before any feature code exists.

Phase 0 is deliberately front-loaded. The assessment rewards production-minded behaviour (layering, typed boundaries, scale claims you can prove). Wiring the guardrails first is cheaper than retrofitting them after five phases of feature work.

### 0.1 · Project layout and Next.js config

- [ ] Move `app/` → `src/app/`; update `tsconfig` paths to `@/*` → `./src/*`
- [ ] Delete the starter page and unused `public/` assets
- [ ] `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `typedRoutes: true`, security headers, `optimizePackageImports` for `lucide-react` and `@base-ui/react`
- [ ] Install runtime and dev dependencies ([02](./02-tech-stack-decisions.md#summary))
- [ ] `pnpm dlx shadcn@latest init --template next --base base`; confirm `components.json` has `"base": "base"`
- [ ] Install required shadcn primitives per [14 · UI component plan](./14-ui-component-plan.md#required-core-deliverable); mount `<Toaster />` in root layout
- [ ] `src/server/env.ts` — Zod-parsed environment, imported for its side effect at startup
- [ ] `src/lib/result.ts`, `src/server/errors/app-error.ts`
- [ ] `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`
- [ ] Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `knip`, `test`, `test:run`, `test:e2e`, `db:*`, `verify`

### 0.2 · Agent context (token-optimised Cursor rules)

Keep rules **short, scoped, and link to `docs/`** for detail. One concern per file; target under ~50 lines each so agent context stays cheap.

| File | Scope | Purpose |
|---|---|---|
| `.cursor/rules/00-project.mdc` | `alwaysApply: true` | Stack (Next 16, React 19, SQLite, shadcn/Base UI), assessment constraints, link to `docs/README.md` |
| `.cursor/rules/01-architecture.mdc` | `src/**/*` | Layer dependency rule from [03](./03-system-architecture.md#the-dependency-rule); routes thin; DAL on every read/write |
| `.cursor/rules/02-nextjs-rsc.mdc` | `src/app/**`, `src/features/**` | No top-level `await` in layouts; `searchParams` as a promise inside Suspense; Server Components by default |
| `.cursor/rules/03-server-actions.mdc` | `src/features/**/actions/**` | Four-step preamble; return `Result` not throw; idempotency + version checks |
| `.cursor/rules/04-testing.mdc` | `**/*.{test,spec}.{ts,tsx}`, `src/test/e2e/**` | Unit for pure logic; integration against real SQLite; Playwright for async RSC — see [09](./09-testing-strategy.md) |
| `.cursor/rules/05-ui-a11y.mdc` | `src/components/**`, `src/features/**/components/**` | Semantic HTML, keyboard, no colour-only status; shadcn Base UI `render` not `asChild` |

- [ ] Create the rule files above; extend `AGENTS.md` with a short **project** block (architecture one-liner, `pnpm verify`, pointer to `docs/`) — keep the Next.js block `next dev` generates
- [ ] Optional: `.cursor/skills/portal/SKILL.md` — a single skill that indexes `docs/` by phase (for agents that support project skills); do **not** duplicate full doc content

**Rejected:** one giant always-on rule file (burns tokens every turn); copying all of `docs/` into rules (stale the moment the code diverges).

### 0.3 · ESLint (production-grade, flat config)

Build on `eslint-config-next` and turn strictness up where it earns its keep. Prettier owns formatting; ESLint owns correctness.

- [ ] `eslint.config.mjs` — extend `eslint-config-next/core-web-vitals` + `typescript-eslint` **strict-type-checked** (or `recommendedTypeChecked` if strict blocks progress on day one, with a comment to tighten)
- [ ] `eslint-plugin-jsx-a11y` — explicit recommended rules (do not rely on Next defaults alone)
- [ ] `import/no-restricted-paths` — encode every row of the layer table from [03](./03-system-architecture.md#the-dependency-rule)
- [ ] `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`
- [ ] `@typescript-eslint/consistent-type-imports` with `prefer: 'type-imports'` and `fixStyle: 'inline-type-imports'`
- [ ] `import/no-cycle` — catches service ↔ repository back-edges early
- [ ] `no-console` — `warn`, allow `console.warn` / `console.error` only
- [ ] `eslint-config-prettier` — **last** in the config array so format rules do not fight Prettier
- [ ] `server-only` convention: every file under `src/server/` imports `'server-only'`; add an ESLint `no-restricted-imports` override in `src/app/**` and client files blocking `@/server/db` and `@/server/repositories`

### 0.4 · Prettier, EditorConfig, and VS Code

- [ ] `prettier.config.mjs` — `singleQuote`, `semi: false`, `trailingComma: 'all'`, `printWidth: 100`
- [ ] `prettier-plugin-tailwindcss` — class order sorted automatically
- [ ] `.prettierignore` — `.next`, `drizzle/meta`, `pnpm-lock.yaml`, `src/components/ui/**` (only if you choose not to reformat vendored shadcn files)
- [ ] `.editorconfig` — `utf-8`, `lf`, `indent_size = 2`, `insert_final_newline = true`, trim trailing whitespace
- [ ] `.vscode/settings.json`:
  - `editor.formatOnSave: true`, `editor.defaultFormatter: esbenp.prettier-vscode`
  - `editor.codeActionsOnSave`: `source.fixAll.eslint: "explicit"`, `source.organizeImports: "never"` (ESLint handles imports)
  - `typescript.tsdk: node_modules/typescript/lib`, `typescript.enablePromptUseWorkspaceTsdk: true`
  - `tailwindCSS.experimental.classRegex` for `cn()` / `cva()` if used
- [ ] `.vscode/extensions.json` — recommend: ESLint, Prettier, Tailwind CSS IntelliSense, Playwright, EditorConfig

### 0.5 · Git hooks (Lefthook)

Use **Lefthook** (not Husky) — fast, YAML-configured, no `npx` shim per hook.

`lefthook.yml`:

| Hook | Commands | Rationale |
|---|---|---|
| **pre-commit** | `lint-staged` | Fast; only touches staged files |
| **pre-push** | `pnpm typecheck` + `pnpm test:run` | Catches type and unit regressions before remote |
| **commit-msg** | *(optional)* `commitlint` | Skip unless you want conventional commits in the README |

`lint-staged` (in `package.json` or `lint-staged.config.mjs`):

```jsonc
{
  "*.{ts,tsx,mjs}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

- [ ] `lefthook install` documented in README setup
- [ ] `.github/workflows/verify.yml` — runs `pnpm verify` on push/PR ([15](./15-local-setup.md#ci-workflow))
- [ ] `pnpm verify` remains the **full** gate (`typecheck` → `lint` → `knip` → `test:run` → `build` → `test:e2e`) — run in CI and before submission; **not** on every push

**Rejected:** running full `pnpm verify` on pre-commit (blocks flow); Husky (heavier, no advantage here).

### 0.6 · TypeScript (strict compiler options)

Start from `strict: true` and add options that catch real bugs without fighting Next's generated types.

`tsconfig.json` (app):

- [ ] `"strict": true` (baseline)
- [ ] `"noUncheckedIndexedAccess": true` — `arr[i]` is `T | undefined`; forces guards at boundaries
- [ ] `"noImplicitOverride": true`, `"noFallthroughCasesInSwitch": true`, `"forceConsistentCasingInFileNames": true`
- [ ] `"verbatimModuleSyntax": true` — `import type` enforced; better tree-shaking signal
- [ ] `"noEmit": true`, `"incremental": true`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`
- [ ] `"plugins": [{ "name": "next" }]`, `"paths": { "@/*": ["./src/*"] }`

Optional (enable if the codebase stays green; document if deferred):

- `"exactOptionalPropertyTypes": true` — stricter optional props; high value, occasional friction with third-party types
- `"noPropertyAccessFromIndexSignature": true` — pairs with unchecked-index access

`tsconfig.build.json` or split configs:

- [ ] `tsconfig.test.json` extending the app config — include Vitest globals, `src/test/**`
- [ ] `typecheck` script: `next typegen && tsc --noEmit` (generated route types must exist first — see [09](./09-testing-strategy.md#commands))

Every file under `src/server/` and Server Actions: **explicit return types** on exported functions (enforced via ESLint `@typescript-eslint/explicit-module-boundary-types` on `src/server/**` and `src/features/**/actions/**` only — not on every React component).

### 0.7 · Dead code and dependency hygiene (Knip)

[Knip](https://knip.dev) finds unused dependencies, exports, and files — the kind of drift that accumulates when you add shadcn components and Drizzle scripts across eight phases.

**Why it helps this assessment:** the brief cares about bundle discipline and maintainable architecture. Knip backs up the dependency-budget story in [02](./02-tech-stack-decisions.md#dependency-budget) with evidence: no orphaned dependencies, no dead utility left after a refactor, no `package.json` entry that nothing references. It is a senior signal without being a feature requirement.

**Caveats:** Knip needs honest Next.js entry configuration. False positives are common until `knip.json` (or `knip.ts`) accounts for framework conventions. Budget an hour in Phase 0 to tune ignores, not to fight the tool daily.

- [ ] `knip` (dev dependency) + `knip.json` — the Next.js plugin enables automatically when `next` is installed (App Router entries, `proxy.ts`, `loading.tsx`, route handlers, etc.)
- [ ] Declare non-route entry points explicitly:
  - `package.json` scripts (`db:seed`, `db:migrate`, …) — Knip follows script commands
  - `drizzle.config.ts` and migration tooling
  - `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`
- [ ] `ignore` patterns for known noise:
  - `src/components/ui/**` — shadcn components are installed before every export is consumed; re-enable strict checks once the UI is wired
  - generated paths: `.next/**`, `drizzle/meta/**`
- [ ] `ignoreDependencies` for toolchain-only packages Knip cannot trace (e.g. `@tailwindcss/postcss`, `babel-plugin-react-compiler`)
- [ ] Scripts: `"knip": "knip"`, `"knip:fix": "knip --fix"` (auto-remove safe unused devDependencies and `package.json` entries)
- [ ] Include `pnpm knip` in `pnpm verify` **after** `lint`, before `test:run` — not on pre-commit (too slow when tuning config); optional on pre-push once the config is stable

Example shape (tune as the tree grows):

```jsonc
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignore": ["src/components/ui/**"],
  "ignoreDependencies": ["@tailwindcss/postcss", "babel-plugin-react-compiler"],
  "ignoreExportsUsedInFile": true
}
```

**Rejected:** running Knip without a Next-aware config (noisy, gets disabled); treating Knip as a substitute for tests (it finds dead code, not wrong code).

### 0.8 · Repository hygiene

- [ ] `.nvmrc` or `package.json` `"engines": { "node": ">=22" }` — match the Node version you develop against
- [ ] `.npmrc`: `strict-peer-dependencies=true` (pnpm)
- [ ] `.env.example` per [15 · Local setup](./15-local-setup.md#environment-variables); real `.env*` gitignored
- [ ] `db:*` scripts per [15](./15-local-setup.md#database-scripts)
- [ ] `.github/workflows/verify.yml` per [15](./15-local-setup.md#ci-workflow)
- [ ] `README.md` stub: prerequisites, `pnpm install`, `lefthook install`, `db:migrate`, `db:seed`, test credentials from [15](./15-local-setup.md#seeded-test-accounts), `pnpm verify`

### Done when

- [ ] `pnpm verify` passes on an empty application (lint, typecheck, knip, unit, build, E2E scaffold green)
- [ ] An import that violates a layer boundary **fails ESLint** with a clear message
- [ ] Saving a `.tsx` file in VS Code formats with Prettier and applies ESLint fixes
- [ ] A commit with a lint error is **blocked** by Lefthook; a push with a type error is **blocked** by pre-push
- [ ] Cursor opens with workspace TypeScript and the rule files above active

Getting the boundary lint and hooks working before feature code exists is the point. Added afterwards, they report dozens of violations and get disabled — which is worse than never having had them.

## Phase 1 · Data layer

**Goal:** a seeded 12,000-row database with queries proven to use indexes.

- [ ] `server/db/schema.ts` — tables, enums, indexes, the `priority_rank` generated column
- [ ] `server/db/client.ts` — libSQL + Drizzle singleton (module-scoped, so dev HMR does not open a connection per reload)
- [ ] Drizzle Kit migrations, committed
- [ ] FTS5 virtual table and sync triggers as a migration
- [ ] `server/db/seed.ts` — deterministic, batched in one transaction, realistic distributions
- [ ] Repositories: `request`, `activity`, `user`, `reference` — returning narrow DTOs
- [ ] Keyset pagination: cursor encode/decode, predicate builder, the whitelisted sort map
- [ ] Integration tests, including the 12,000-row no-gaps pagination test and the `EXPLAIN QUERY PLAN` assertion

**Done when:** `pnpm db:seed` produces 12,000 requests in under 30 seconds, and every list query plan is free of `SCAN service_requests`.

**Risk:** the FTS5 trigger setup is the fiddliest part. If it resists, ship a `subject LIKE` fallback behind the same repository function and return to it — the interface does not change, so nothing downstream is blocked.

## Phase 2 · Authentication

**Goal:** a working login/logout flow with the Data Access Layer in place.

- [ ] `server/auth/session.ts` — iron-session seal/unseal, cookie options per [06](./06-auth-and-security.md#sessions)
- [ ] `server/auth/password.ts` — argon2 hash and verify
- [ ] `server/auth/dal.ts` — `getCurrentUser()` with `use cache: private`, and `requireUser()` returning a `Result`
- [ ] `server/auth/permissions.ts` — the capability map
- [ ] `server/auth/rate-limit.ts` — in-memory sliding window
- [ ] Login and logout Server Actions, with the constant-time dummy-hash path for unknown emails
- [ ] `(auth)/login/page.tsx` and the `LoginForm` Client Component (`input`, `label`, `button` — [14](./14-ui-component-plan.md#auth-phase-2))
- [ ] `src/proxy.ts` — optimistic redirect with the `?next=` parameter
- [ ] Four seeded credentialed accounts, one per role, documented in the README

**Done when:** all four accounts can sign in and out; a protected URL redirects and returns the user to their original destination; six rapid failed attempts are rate-limited.

This is where `use cache: private` gets exercised for the first time. Confirm the dev overlay is clean before moving on — a session read in the wrong place is much cheaper to fix now than after five pages depend on it.

## Phase 3 · Dashboard

**Goal:** the core screen, correct and fast.

- [ ] `lib/search-params/` — Zod URL contract, `categories.ts` (slug enum), parse, serialise, cursor helpers; slug → id resolution in `request.service`
- [ ] `lib/hooks/use-debounced-callback.ts` — used by `SearchInput` only ([02](./02-tech-stack-decisions.md#debounced-search-timing))
- [ ] `(portal)/layout.tsx` — app shell with the session read pushed into a Suspense-wrapped header
- [ ] `requests/page.tsx` — non-async, `searchParams` promise passed down
- [ ] `request-columns.ts` — shared column definitions (desktop table + mobile cards)
- [ ] `RequestTable` and `RequestRow` — Server Components (semantic `<table>`, no TanStack Table)
- [ ] `RequestTableSkeleton` — matching the real row geometry
- [ ] `FilterBar`, `SearchInput` (debounced), filter chips — Client Components (`popover`, `checkbox`, `sheet` on mobile — [14](./14-ui-component-plan.md#dashboard-phase-3))
- [ ] `Pagination` — anchors only
- [ ] `FacetCounts` — cached, tagged
- [ ] `StatusBadge`, `PriorityBadge`, `ResultsLiveRegion`, `SkipLink`, `PerPageSelect`, `UserMenu` / `PortalNav`
- [ ] Both empty states, `loading.tsx`, `error.tsx`
- [ ] Responsive CSS: table → cards, with `data-label` pseudo-elements
- [ ] Accessible table semantics: `<caption>`, `scope`, `aria-sort`, the live region

**Done when:** every column renders; search debounces to a single navigation; multiple filters compose; a filtered URL pasted into a fresh browser reproduces the view exactly; the layout is correct at 375px, 768px and 1280px; `jest-axe` and `axe-core/playwright` are clean.

**Checkpoint:** run `pnpm build` and confirm the route reports a static shell. If it does not, a boundary is misplaced, and that is the signal to fix it before Phase 4 adds more surface.

## Phase 4 · Request detail

**Goal:** the detail page with activity history, working under direct access and refresh.

- [ ] `requests/[id]/page.tsx` using `PageProps<'/requests/[id]'>`
- [ ] `RequestDetailPanel` (read-only status/assignee), `RequestDetailSkeleton` ([14](./14-ui-component-plan.md#request-detail-phase-4))
- [ ] `ActivityTimeline` + `ActivityEntry` — Server Components in their own Suspense boundary
- [ ] `generateMetadata` reusing the `React.cache`-memoised query
- [ ] `not-found.tsx`, `loading.tsx`, `error.tsx` for the segment
- [ ] `notFound()` for unknown ids and for ids outside the user's scope
- [ ] `prefetch={true}` on the subject link in the list

**Done when:** direct URL access works from a cold start; refresh preserves the view; an unknown id shows not-found; the timeline streams independently of the details above it.

## Phase 5 · Update workflow

**Goal:** the requirement with the most hidden depth, fully implemented.

- [ ] `request-status.machine.ts` and its exhaustive N×N test
- [ ] `updateStatusIfVersionMatches` and the assignee equivalent — version-conditional updates
- [ ] `server/services/idempotency.ts`, with the unique-constraint violation translated to "already applied"
- [ ] `request.service.ts` — the full transaction: version check, update, activity insert, `resolved_at`
- [ ] `updateStatus` and `updateAssignee` Server Actions with the four-step preamble
- [ ] `StatusControl`, `RowStatusControl`, and `AssigneeControl` (`dropdown-menu` / `combobox` + virtual list) — `useOptimistic` + `useTransition` ([14](./14-ui-component-plan.md#update-workflow-phase-5))
- [ ] `updateTag` / `revalidateTag` invalidation
- [ ] Toast messages per `AppError` code via `sonner`; `tooltip` on disabled controls when `canEdit` is false
- [ ] Conflict handling with a recovery action
- [ ] Virtualised assignee picker — the one place virtualisation is used
- [ ] E2E: `update-assignee`, rollback on failure, conflict between two contexts, double-click producing one activity entry, `access-control` role specs

**Done when:** the optimistic update is visible before the response; an intercepted failing action rolls the UI back; two browser contexts editing the same request produce a conflict rather than a lost update; a rapid double-click creates exactly one activity entry.

This is the phase most worth over-investing in. It is where the brief's language is most demanding, and where the gap between a working demo and a production-minded implementation is widest.

## Phase 6 · Insights and the summary utility

**Goal:** the advanced-JavaScript requirement, plus a screen that justifies it.

- [ ] `lib/summarize-activity/` — types, validation, single-pass aggregation, P² quantile, streaming variant
- [ ] The full unit suite from [10](./10-activity-summary-utility.md#tests), including the 100,000-record performance test
- [ ] `streamAssignmentActivity()` — a cursor-based async generator in the repository
- [ ] `insights/page.tsx` with `InsightsSummaryTable` ([14](./14-ui-component-plan.md#insights-phase-6))
- [ ] `RejectedRecordsDisclosure` (`collapsible`)
- [ ] E2E: `insights.spec.ts`

**Done when:** 100,000 records summarise in under 250 ms with heap growth bounded by assignee count; every invalid-input case is covered; the sync and async variants agree exactly.

Scheduled after Phase 5 because it is self-contained and the most easily verified part of the deliverable. It can be built in isolation without touching the mutation pipeline — useful if you want a clean checkpoint before hardening.

## Phase 7 · Hardening

- [ ] `api/health/route.ts`
- [ ] `global-error.tsx`, root `not-found.tsx`
- [ ] Focus-visible audit across every interactive element
- [ ] `prefers-reduced-motion` support
- [ ] Full keyboard-only journey, unassisted by a mouse
- [ ] Manual screen-reader pass: VoiceOver/Safari and NVDA/Firefox
- [ ] `pnpm knip` — zero unused dependencies and no orphaned source files before submission
- [ ] `next experimental-analyze` — review per-route client bundles
- [ ] Lighthouse on a production build, in incognito
- [ ] Review the dev overlay for remaining instant-navigation insights
- [ ] Write the root `README.md`: prerequisites, setup, seed, credentials, scripts, troubleshooting
- [ ] Final `pnpm verify`

## Risk register

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| `cacheComponents` build errors block progress | Medium | High | Phase 3's checkpoint surfaces it early. Per-segment `export const instant = false` unblocks one route; removing the flag unblocks everything, at the cost of the PPR story |
| FTS5 triggers prove fiddly | Medium | Low | Ship the `LIKE` fallback behind the same repository function; revisit later |
| `@node-rs/argon2` has no prebuilt binary for the platform | Low | Medium | Swap to `bcryptjs`; one file, `server/auth/password.ts` |
| React Compiler slows builds noticeably | Medium | Low | Already accepted. Disabling is a one-line config change |
| P² median is harder than expected | Low | Low | Report mean only. The contract already allows `null` for median |
| Scope creep into request creation | Medium | Medium | Explicitly out of scope per [01](./01-requirements-traceability.md#requirements-this-design-intentionally-does-not-cover) |

The first row is the one to watch. `cacheComponents` is the highest-leverage and highest-risk decision in this design, which is exactly why Phase 3 ends with a build checkpoint rather than leaving verification to the end.

## Extension points

Worth noting in the README as deliberate future work rather than oversights:

- **PostgreSQL** — swap `server/db/client.ts` and move FTS to `tsvector`. Repository signatures are unchanged.
- **Database-backed sessions** — a `sessions` table enables server-side revocation. One function changes.
- **Real-time updates** — SSE on a Route Handler, or polling with `refresh()`. This is the change that would justify introducing TanStack Query.
- **Redis rate limiting** — replace the in-memory limiter behind its existing interface.
- **Bulk actions** — the idempotency and concurrency primitives already support them; only the UI is missing.
- **Nonce-based CSP** — becomes available if `experimental.sri` stabilises, resolving the PPR conflict described in [06](./06-auth-and-security.md#content-security-policy).
