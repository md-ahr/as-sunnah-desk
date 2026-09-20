# 02 · Tech Stack Decisions

Every dependency is a liability that has to justify itself. This document records what was chosen, why, and — more usefully — what was rejected and on what grounds.

The hard constraints from the brief shape most of these: **Next.js for frontend and backend, no separate backend application, must run locally with no paid external service.**

## Summary

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | 16.3.5 (installed) |
| UI runtime | React | 19.2.8 (installed) |
| Language | TypeScript, `strict` | 5.x |
| Compiler | React Compiler (`reactCompiler: true`) | `babel-plugin-react-compiler` 1.0.0 (installed) |
| Styling | Tailwind CSS | 4.x (installed) |
| Component primitives | shadcn/ui on Base UI (`@base-ui/react`) | latest |
| Database | SQLite via libSQL, local file | `@libsql/client` 0.18.x |
| ORM / query builder | Drizzle ORM + Drizzle Kit | 0.45.x / 0.31.x |
| Validation | Zod | 4.x |
| Sessions | iron-session | 9.x |
| Password hashing | `@node-rs/argon2` | 2.x |
| Dashboard columns | Shared `request-columns.ts` constant | — |
| Virtualisation | TanStack Virtual (assignee picker only) | 3.x |
| Toasts | sonner | 2.x |
| Seed data | `@faker-js/faker` (dev only) | latest |
| Unit / integration tests | Vitest + React Testing Library | Vitest 5.x |
| E2E tests | Playwright | 1.63.x |
| Accessibility tests | `jest-axe` + `@axe-core/playwright` | — |
| Lint | ESLint flat config + `eslint-config-next` | ESLint 9.x |
| Dead code / deps | Knip | 5.x |

Peer ranges for every library above were checked against React 19 and Next 16 before selection.

## Framework and runtime

### Next.js 16 App Router

Mandated by the brief, but the version matters more than usual. Next.js 16 is not a minor iteration on 15:

- `middleware.ts` is renamed to `proxy.ts`, and the Node.js runtime is the only option there.
- Partial Prerendering is no longer behind `experimental.ppr`; it is what you get when you enable `cacheComponents`.
- `revalidateTag` now requires a second argument, and `updateTag` / `refresh` are new.
- `next lint` is removed; ESLint runs directly.
- `params` and `searchParams` are Promises with no synchronous fallback.
- Turbopack is the default for both `dev` and `build`.

Writing this application as if it were Next.js 14 would produce code that either fails to build or silently misses the version's actual capabilities. [13 · Next.js 16 reference](./13-nextjs-16-reference.md) captures the specifics.

> **Decision — enable `cacheComponents: true`.**
>
> This turns on the `use cache` directive family, `cacheLife`, `cacheTag`, and makes Partial Prerendering the default rendering model. It is the current Next.js caching model and the one this application's performance story is built on.
>
> **Rejected:** staying on the pre-Cache-Components model (`fetch` cache options, `unstable_cache`, route segment `revalidate`). It still works in 16 and is lower-risk, but it is the legacy path — and for a dashboard whose whole problem is "fast reads over a large dataset with per-user authorization", the ability to give a static shell to every route while user-scoped rows stream in is precisely the capability worth demonstrating.
>
> **Trade-off:** `cacheComponents` is strict. Uncached data or a runtime API (`cookies()`, `headers()`, `searchParams`) outside a `<Suspense>` boundary becomes a build error, and synchronous non-deterministic calls (`Date.now()`, `Math.random()`) throw during prerendering. That strictness is the point — it forces the Suspense structure that makes streaming work — but the component tree must be designed around it from the start rather than retrofitted. The per-segment escape hatch is `export const instant = false`; the nuclear option is removing the flag and following the `caching-without-cache-components` guide.

### React Compiler

Already enabled in `next.config.ts`. It auto-memoises components, which is why this design contains almost no hand-written `useMemo`, `useCallback` or `React.memo`. Adding them manually on top of the compiler is redundant at best.

**Trade-off:** the compiler relies on Babel, so dev and build compile times are higher. Accepted — memoisation that is correct by default is worth more than a few seconds of build time, and it removes the class of bugs caused by wrong dependency arrays.

## Data layer

This is the decision with the widest range of defensible answers, so the reasoning is spelled out.

The requirements are 10,000+ records, real filtering/sorting/pagination behaviour, and zero paid external services. That rules out a hosted database. It also effectively rules out an in-memory JSON array, because an array cannot demonstrate index usage, query planning, or full-text search — the very things that make 10,000 rows a non-issue.

> **Decision — SQLite as a local file, accessed through the async libSQL client, with Drizzle ORM.**
>
> SQLite gives real SQL: composite indexes, `EXPLAIN QUERY PLAN`, FTS5 full-text search, and window functions. It needs no daemon, no Docker, and no credentials — `pnpm db:seed` produces a working **12,000-row** database (above the brief's 10,000+ threshold). Drizzle gives fully typed queries inferred from the schema, plus SQL-shaped composability, which matters because the list query is assembled from a variable number of filter predicates.

**Why the async libSQL client rather than `better-sqlite3` or `node:sqlite`.** This is subtle but genuinely important under Cache Components. The Next.js 16 docs classify synchronous I/O — naming `better-sqlite3` and `node:sqlite` explicitly — as a *predictable value* that completes during prerendering and gets baked into the static shell. For per-request, per-user data that is exactly wrong: you would have to remember to call `connection()` before every query to prevent it. `@libsql/client` is async, so queries behave as uncached dynamic reads and the framework's own Suspense validation catches mistakes for you. Choosing the async driver removes a footgun instead of documenting one.

**Rejected alternatives:**

| Option | Why not |
|---|---|
| PostgreSQL in Docker | The most production-realistic choice, and the repository layer is written so the swap is a driver change. Rejected here because it adds a Docker prerequisite to "run locally", and demonstrates nothing about the frontend that SQLite does not. |
| Prisma | Excellent DX, but a heavier toolchain (engine binary, generate step) and less natural for dynamically composed `WHERE` clauses. |
| In-memory array / JSON file | Cannot demonstrate indexing, query planning, or FTS. "10,000 records" becomes a claim rather than a property. |
| PGlite (Postgres in WASM) | Interesting, and would give Postgres semantics locally, but immature enough to be a risk on the critical path. |
| Raw SQL, no ORM | Loses end-to-end type inference between schema and UI, which is much of what makes the data layer maintainable. |

## Validation

> **Decision — Zod 4 as the single validation library, with schemas as the contract at every trust boundary.**

There are exactly three trust boundaries, and Zod owns all of them:

1. **The URL** → the search-params schema. Invalid input coerces to defaults rather than erroring, because a malformed URL should not break a dashboard.
2. **Form and action input** → per-action input schemas. Failures are *returned* as field errors, following the Next.js guidance that expected errors are return values rather than exceptions.
3. **Environment variables** → parsed once at startup, so a missing `SESSION_PASSWORD` fails immediately and loudly instead of at first login.

Types are always inferred from schemas, never written alongside them, so the two cannot drift.

**Rejected:** Valibot (smaller bundle, but all validation here is server-side where bundle size is irrelevant); Yup (weaker inference); hand-rolled guards (no composability, no free error shapes).

## Sessions and passwords

> **Decision — `iron-session` for encrypted stateless cookie sessions; `@node-rs/argon2` for password hashing.**

`iron-session` is one of the two libraries the Next.js authentication docs name, and it is the library used in the official Cache Components authentication example — which matters, because that example demonstrates the `use cache: private` pattern this design relies on to keep authenticated navigation fast.

The session cookie holds only a `userId` and an expiry. Every request resolves that id to a user row in the database, so a deactivated account loses access immediately rather than at cookie expiry. This is the "secure check" the docs distinguish from an "optimistic check".

`@node-rs/argon2` ships prebuilt native binaries, so there is no compiler toolchain requirement, and Argon2id is the current recommendation for password hashing.

**Rejected:**

| Option | Why not |
|---|---|
| NextAuth / Auth.js | The right answer for a real product with OAuth providers, but for "a simple login/logout flow" it hides exactly the session-handling and authorization-layering decisions the assessment wants to see. |
| Clerk / Auth0 / Better Auth | External services, or more surface area than the brief needs. |
| Hand-rolled JWT with `jose` | Also documented and perfectly valid. `iron-session` won because sealed-cookie semantics are simpler to reason about, and no third party needs to verify the token. |
| `bcryptjs` | No native dependency, but markedly slower, and Argon2id is the better primitive. |

## UI layer

> **Decision — Tailwind CSS 4 with shadcn/ui components built on Base UI primitives.**

Tailwind 4 is already installed and configured. Its relevance here is not developer convenience but that the responsive strategy is *pure CSS*: the same server-rendered DOM becomes a table on desktop and a card list on mobile. No breakpoint detection in JavaScript, therefore no hydration mismatch and no layout shift.

shadcn/ui is not a dependency in the usual sense — components are copied into the repository and owned outright. That matters for an assessment: the accessibility behaviour is visible and reviewable rather than buried in `node_modules`. Underneath, Base UI (`@base-ui/react`) provides the parts that are genuinely hard to get right: focus trapping in dialogs, roving tabindex in menus, correct ARIA wiring, screen-reader announcements.

Initialize with Base UI as the primitive layer — it is shadcn's default for new projects:

```bash
pnpm dlx shadcn@latest init --template next --base base
```

`components.json` must pin `"base": "base"`. Add components only through the CLI so every file in `components/ui/` targets the same primitive library. Do not mix Radix and Base UI variants in one project.

**API note:** Base UI uses `render` where Radix uses `asChild` (for example, custom triggers on menus and dialogs). Follow the Base UI tab on the shadcn docs when copying examples.

**Component scope:** install only the primitives the assessment needs — see the full inventory in [14 · UI component plan](./14-ui-component-plan.md).

**Rejected:** MUI and Ant Design (large client bundles, and a styling model that fights Server Components); Chakra (runtime CSS-in-JS, the wrong shape for an RSC app); Radix via shadcn (still fully supported, but not chosen — Base UI is the current shadcn default for greenfield work); Headless UI (good, but a narrower primitive set); fully hand-rolled components (would mean hand-rolling focus management, which is where accessibility bugs live).

## Table markup, virtualisation, and URL state

> **Decision — semantic HTML `<table>` + a shared column-definition module. No TanStack Table, no shadcn `data-table` block.**

shadcn/ui provides **styled primitives** (`button`, `badge`, `sheet`, …) and an optional `table` element wrapper for cosmetics. It does **not** replace a table library — and we do not need one. The shadcn `data-table` block is built on TanStack Table and pulls client-side table state into the bundle; that fights the server-rendered, SQL-paginated design.

Instead, `features/requests/request-columns.ts` exports a single typed array — column id, header label, sort key, responsive visibility, `data-label` for mobile cards — that both `RequestTable` (desktop `<th>` / `<td>`) and the mobile card CSS read from. Filtering, sorting, and pagination stay in SQL; the column module is the only source of truth for *what* renders.

**Rejected:** TanStack Table (unnecessary dependency for eight columns of server-rendered data); shadcn `data-table` block (TanStack Table + client patterns we explicitly avoid).

> **Decision — virtualisation in exactly one place: the assignee picker.**

The main table is server-paginated at 10–100 rows, which is far below the threshold where virtualisation helps. Adding it there would introduce a scroll container that degrades keyboard and screen-reader navigation in exchange for nothing. The assignee picker is a genuinely long client-side list, so it gets `@tanstack/react-virtual`. Reaching for virtualisation where pagination is the correct answer is a common misapplication, and this split is deliberate.

> **Decision — a hand-written, Zod-typed search-params module rather than a URL-state library.**

Roughly 120 lines owns parsing, serialising, defaults, and the mapping from a `sort` enum to indexed SQL columns. Writing it directly keeps the URL contract in one readable file, makes the whitelisting of sortable columns explicit (a URL value must never reach SQL as a column name), and means the server and client parse the URL with the same schema.

Category filters use **slugs** in the URL (`it-support`) and resolve to FK ids in `RequestService` before SQL runs — readable shared links without exposing internal ids. Assignee filters use user ids (`user_admin`); status and priority use DB enums directly. See [04 · URL filter identifiers](./04-data-model-and-scale.md#url-filter-identifiers).

**Rejected:** `nuqs` — a good library, Next 16 compatible, and the right choice in a larger app with many independent URL-state consumers. Here it would abstract the one thing most worth showing explicitly.

### Debounced search timing

> **Decision — a hand-written `useDebouncedCallback` hook, not a debounce library.**

Search debouncing applies in exactly one place: `SearchInput`. A ~15-line hook in `lib/hooks/use-debounced-callback.ts` wraps `setTimeout`/`clearTimeout` with correct cleanup on unmount. Filters and `PerPageSelect` commit to the URL immediately — only the search field is debounced (300 ms).

**Rejected:** `use-debounce` / `lodash.debounce` — adds a dependency for logic that fits in one file; **inline `setTimeout` in the component** — duplicates cleanup if a second debounced control appears later.

## Feedback, and what is deliberately absent

`sonner` provides toasts: small, accessible, React 19 compatible. Toasts are supplementary feedback only — the durable state change is always visible in the UI, because a toast that has been dismissed is not feedback.

Three notable absences:

- **No client data-fetching library.** No SWR, no TanStack Query. Reads are Server Components; writes are Server Actions with `updateTag` for read-your-writes. Adding a client cache would mean maintaining a second, competing source of truth over the same data. If real-time updates were added later, this is the decision that would be revisited first.
- **No global client state manager.** No Redux, no Zustand. Server data lives on the server, filter state lives in the URL, and the remaining state is local to components. There is no global client state left to manage. Introducing a store here would be solving a problem the architecture does not have.
- **No form library.** `useActionState` plus Zod covers the login and update forms, and keeps them working without JavaScript. React Hook Form would be the right call for a large multi-step form with complex cross-field validation; neither form here is that.

## Tooling

- **Vitest** for unit and component tests, configured exactly as the Next.js docs specify (`@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`).
- **Playwright** for E2E. This is not merely belt-and-braces: the Next.js docs state plainly that Vitest does not support async Server Components and recommend E2E tests for them. Since most of this application *is* async Server Components, Playwright carries the real coverage weight. See [09 · Testing strategy](./09-testing-strategy.md).
- **ESLint flat config** with `eslint-config-next/core-web-vitals`, `typescript-eslint` type-checked rules, `jsx-a11y`, `import/no-restricted-paths` (layer boundaries), and `eslint-config-prettier`. See [11 · Phase 0](./11-implementation-roadmap.md#phase-0--foundation) for the full rule set.
- **Prettier** + `prettier-plugin-tailwindcss` for formatting; **EditorConfig** and **VS Code** workspace settings for format-on-save and ESLint fix-on-save.
- **Lefthook** + **lint-staged** for pre-commit (lint/format staged files) and pre-push (typecheck + unit tests). Full `pnpm verify` runs in CI and before submission, not on every push.
- **Cursor rules** (`.cursor/rules/*.mdc`) — token-optimised, scoped agent context aligned with stack and architecture. Detailed in Phase 0.
- **TypeScript** — `strict` plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and related compiler flags. See Phase 0.
- **Knip** for unused dependencies, exports, and files. The Next.js plugin is automatic; `pnpm knip` runs in `verify`. Keeps the [dependency budget](#dependency-budget) honest as features land. See [11 · Phase 0](./11-implementation-roadmap.md#07--dead-code-and-dependency-hygiene-knip).
- **Drizzle Kit** for migrations, so schema changes are versioned files rather than ad-hoc DDL.

## Dependency budget

Runtime dependencies added to the installed baseline: `@libsql/client`, `drizzle-orm`, `zod`, `iron-session`, `@node-rs/argon2`, `@tanstack/react-virtual`, `sonner`, `lucide-react`, `server-only`, and `@base-ui/react` (the primitives that shadcn/ui components require).

Of these, only `@tanstack/react-virtual`, `sonner`, `lucide-react`, and `@base-ui/react` reach the browser in meaningful size. Everything else is server-only and contributes nothing to the client bundle. `optimizePackageImports` is configured for `lucide-react` and Base UI barrels.

Local setup (env, scripts, test accounts, CI): [15 · Local setup](./15-local-setup.md).
