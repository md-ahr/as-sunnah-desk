# As-Sunnah Foundation

**Senior Frontend Developer — Practical Assessment**

## Project Summary

As-Sunnah Foundation receives different types of service and support requests from internal users and stakeholders. This repository delivers a compact **Service Request Management Portal** that enables authorized users to review, search, filter, and manage these requests from a responsive web interface.

Each request contains essential information: requester, subject, category, priority, current status, assigned person, and last update time. Users can open an individual request, review its details and activity history, and update selected information such as status and assignee.

The application is implemented as a small production-style system rather than a UI-only exercise. It is designed for large record counts, slow or failed responses, repeated user actions, direct URL access, different screen sizes, and protected data.

**Solution name:** As-Sunnah Desk

## Technical Specifications

| Area         | Choice                                                                |
| ------------ | --------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router) — frontend and API/backend in one application |
| Language     | TypeScript (strict)                                                   |
| UI           | shadcn/ui on Base UI, Tailwind CSS v4                                 |
| Database     | SQLite via libSQL + Drizzle ORM (local file, no paid services)        |
| Auth         | iron-session (encrypted HTTP-only cookie)                             |
| Testing      | Vitest (unit/integration), Playwright (E2E)                           |
| Quality gate | `pnpm verify`                                                         |

No separate backend application, paid external services, or API keys are required to run locally.

## Feature Requirements

| Requirement                       | Implementation                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & access**       | Login/logout flow; protected portal pages; every Server Action and Route Handler re-verifies the session via a Data Access Layer            |
| **Request dashboard**             | `/requests` lists ID, subject, requester, category, priority, status, assignee, and last updated time                                       |
| **Search, filter & navigation**   | Debounced search (300 ms), multi-select filters, sorting, and pagination; URL preserves filter/sort/page state                              |
| **Request details**               | `/requests/[id]` (human-readable reference, e.g. `SR-2026-000142`); activity timeline; direct URL access and refresh work                   |
| **Update workflow**               | Status and assignee updates via Server Actions; optimistic UI, idempotency keys, optimistic concurrency, rollback on failure                |
| **Application states**            | Loading skeletons, empty states, validation errors, success toasts, error boundaries, and `not-found` pages                                 |
| **Performance & scale**           | Seeded with 12,000+ requests; server-side filtering/sorting/pagination; keyset pagination; FTS5 search; minimal client JavaScript           |
| **Responsive UI & accessibility** | Desktop table / mobile cards via CSS; semantic HTML, keyboard support, ARIA labels, axe checks in E2E                                       |
| **Advanced JavaScript**           | `src/lib/summarize-activity/` — per-assignee summary (total assigned, total resolved, average resolution time) with invalid-record handling |
| **Code architecture**             | Routes → features → services → repositories → database; `lib/` is pure; enforced by ESLint                                                  |

Full traceability: [`docs/01-requirements-traceability.md`](./docs/01-requirements-traceability.md)

## Deliverables

| Deliverable                               | Location                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Complete runnable source code             | This repository                                                                                                         |
| Setup/run instructions & test credentials | This README (sections below)                                                                                            |
| Brief technical note                      | [Technical Note](#technical-note) below; extended version in [`docs/12-technical-note.md`](./docs/12-technical-note.md) |
| Local execution without paid services     | SQLite file database; no external dependencies                                                                          |

---

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 11+

## Setup & Run

```bash
cp .env.example .env
# Set SESSION_PASSWORD to at least 32 characters, e.g.:
# openssl rand -base64 32

pnpm install
pnpm lefthook install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable           | Required | Default              | Purpose                                            |
| ------------------ | -------- | -------------------- | -------------------------------------------------- |
| `DATABASE_URL`     | No       | `file:./data/app.db` | SQLite file path (relative to project root)        |
| `SESSION_PASSWORD` | **Yes**  | —                    | iron-session seal password (minimum 32 characters) |
| `NODE_ENV`         | No       | `development`        | Set by Next.js; affects cookie `secure` flag       |

`.env` and `.env.local` are gitignored. Never commit real secrets.

## Test Credentials

One account is enough to review and update every request. **Local development and E2E only.**

| Email                 | Password     |
| --------------------- | ------------ |
| `admin@assunnah.test` | `test.admin` |

Other seeded users are requesters and assignees. They can sign in with the same access level — there are no separate roles.

## Scripts

| Command           | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm dev`        | Start the dev server                                    |
| `pnpm verify`     | Full quality gate (types, lint, knip, unit, build, e2e) |
| `pnpm test:run`   | Unit and integration tests                              |
| `pnpm test:e2e`   | Playwright against production build                     |
| `pnpm lint`       | ESLint including architecture layer rules               |
| `pnpm typecheck`  | `next typegen` + TypeScript                             |
| `pnpm knip`       | Unused dependency and orphan file check                 |
| `pnpm db:migrate` | Apply pending migrations                                |
| `pnpm db:seed`    | Populate 12,000 requests + reference data               |
| `pnpm db:reset`   | Delete database, migrate, and re-seed                   |
| `pnpm db:studio`  | Drizzle Studio browser UI                               |

## Routes

| Route            | Auth      | Purpose                                                             |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `/login`         | Public    | Login form                                                          |
| `/requests`      | Protected | Dashboard (default landing after login)                             |
| `/requests/[id]` | Protected | Request detail + activity (reference in URL, e.g. `SR-2026-000142`) |
| `/insights`      | Protected | Per-assignee activity summary table                                 |
| `/api/health`    | Public    | Health check (`{ status: 'ok' }`)                                   |

---

## Technical Note

Brief explanation of major architectural decisions, as requested in the assessment brief.

### Server vs Client Components

The default is **server**. `'use client'` is applied only to interactive leaves: debounced search, filter bar, status/assignee controls, login form, and toast host. Pages, layouts, the request table body, activity timeline, and pagination links remain Server Components. At `perPage=100`, that yields 100 small client islands over server-rendered markup — far less JavaScript than hydrating an entire data grid.

`searchParams` is passed as a promise and awaited inside Suspense boundaries so the portal layout never blocks streaming. The session is read once and shared to client components via context.

### State & Data Fetching

- **Reads:** Server Components query the database directly — no SWR, TanStack Query, or client cache.
- **Writes:** Server Actions with Zod validation, session re-verification, and typed `Result` returns for expected failures.
- **Filter state:** The **URL** is the single source of truth. One Zod schema is shared between server (query building) and client (control rendering). Direct access, refresh, sharing, and the back button work without rehydration.
- **Optimistic updates:** `useOptimistic` for status/assignee changes; React reverts automatically when a transition fails.

### Performance Considerations

Designed so page cost is independent of total table size:

- Filtering, sorting, and pagination run in SQL; the client receives one page (10–100 rows).
- **Keyset pagination** (cursor on indexed `updated_at, id`) instead of deep `OFFSET` scans.
- **FTS5** full-text search instead of `LIKE '%term%'`.
- Composite indexes matched to filter/sort combinations; `EXPLAIN QUERY PLAN` asserted in tests.
- Shared reference data cached with `use cache`; the request list is intentionally not cached (per-user, high-cardinality keys).
- Partial Prerendering via `cacheComponents`: static shell streams immediately; user-scoped content follows in Suspense.
- Virtualisation only in the assignee picker — not on the main table, where server pagination is the correct answer.

The database is seeded with **12,000 requests** and ~48,000 activity records so scale behaviour is measured, not assumed.

### Application Structure

```
app/ (thin routes)  →  features/ (vertical slices)  →  server/services  →  server/repositories  →  server/db
                              ↘              lib/ (pure, no imports)              ↙
```

Authorization lives in a **Data Access Layer** that every read and write passes through — including Server Actions, which are reachable by direct `POST` regardless of page-level checks. Role scoping narrows the SQL query, not post-filtered results.

The activity summary utility (`src/lib/summarize-activity/`) lives in `lib/` as pure functions, testable without mocks or framework dependencies. The `/insights` page surfaces its output.

Extended technical note: [`docs/12-technical-note.md`](./docs/12-technical-note.md)

---

## Troubleshooting

**App fails to start with a `SESSION_PASSWORD` error** — ensure `.env` exists and the value is at least 32 characters.

**Empty dashboard after setup** — run `pnpm db:migrate` then `pnpm db:seed`. The seed is idempotent and truncates before re-inserting.

**E2E tests fail locally** — run `pnpm verify` (not `pnpm test:e2e` alone). E2E runs against a production build and seeds the database in global setup.

**`pnpm db:migrate` fails on a fresh clone** — create the data directory with `mkdir -p data`, or run `pnpm db:reset`.

**Port 3000 in use** — start on another port: `pnpm dev --port 3001`.

## Documentation

Implementation specs and design records live in [`docs/`](./docs/README.md):

- [Requirements traceability](./docs/01-requirements-traceability.md)
- [Implementation roadmap](./docs/11-implementation-roadmap.md)
- [Technical note (extended)](./docs/12-technical-note.md)
- [Local setup](./docs/15-local-setup.md)

## Architecture

Four layers enforced by ESLint: routes → features → services → repositories → database. `lib/` is pure. See [docs/03-system-architecture.md](./docs/03-system-architecture.md).
