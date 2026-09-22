# As-Sunnah Desk

Service Request Management Portal — Senior Frontend Developer Practical Assessment for As-Sunnah Foundation.

A Next.js 16 application for reviewing, searching, filtering, and managing internal service requests. Runs locally with SQLite — no paid external services required.

## Live Demo

**[https://as-sunnah-desk.vercel.app/](https://as-sunnah-desk.vercel.app/)**

Sign in with the [test credentials](#test-credentials) below to explore the dashboard, request details, and insights page.

## Setup & Run

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 11+

### Install

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

### Production build

```bash
pnpm build
pnpm start
```

### Environment variables

| Variable           | Required | Default              | Purpose                                            |
| ------------------ | -------- | -------------------- | -------------------------------------------------- |
| `DATABASE_URL`     | No       | `file:./data/app.db` | SQLite file path (relative to project root)        |
| `SESSION_PASSWORD` | **Yes**  | —                    | iron-session seal password (minimum 32 characters) |
| `NODE_ENV`         | No       | `development`        | Set by Next.js; affects cookie `secure` flag       |

`.env` and `.env.local` are gitignored. Never commit real secrets.

### Scripts

| Command           | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm dev`        | Start the dev server                                    |
| `pnpm verify`     | Full quality gate (types, lint, knip, unit, build, e2e) |
| `pnpm test:run`   | Unit and integration tests                              |
| `pnpm test:e2e`   | Playwright against production build                     |
| `pnpm db:migrate` | Apply pending migrations                                |
| `pnpm db:seed`    | Populate 12,000 requests + reference data               |
| `pnpm db:reset`   | Delete database, migrate, and re-seed                   |

### Routes

| Route            | Auth      | Purpose                                           |
| ---------------- | --------- | ------------------------------------------------- |
| `/login`         | Public    | Login form                                        |
| `/requests`      | Protected | Dashboard (default landing after login)           |
| `/requests/[id]` | Protected | Request detail + activity (e.g. `SR-2026-000142`) |
| `/insights`      | Protected | Per-assignee activity summary                     |

### Troubleshooting

**`SESSION_PASSWORD` error on start** — ensure `.env` exists and the value is at least 32 characters.

**Empty dashboard** — run `pnpm db:migrate` then `pnpm db:seed`.

**E2E tests fail** — run `pnpm verify` (not `pnpm test:e2e` alone). E2E uses a production build and re-seeds in global setup.

**Migration fails on fresh clone** — run `mkdir -p data` or `pnpm db:reset`.

**Port 3000 in use** — `pnpm dev --port 3001`.

## Test Credentials

Works on the [live demo](https://as-sunnah-desk.vercel.app/) and for local development.

| Email                 | Password     |
| --------------------- | ------------ |
| `admin@assunnah.test` | `test.admin` |

One account is enough to review and update every request. Other seeded users can sign in with the same access — there are no separate roles.

## Technical Note

### Server vs Client Components

The default is **server**. `'use client'` is applied only to interactive leaves: debounced search, filter bar, status/assignee controls, login form, and toast host. Pages, layouts, the request table body, activity timeline, and pagination links remain Server Components.

`searchParams` is passed as a promise and awaited inside Suspense boundaries so the portal layout never blocks streaming. The session is read once and shared to client components via context.

### State & Data Fetching

- **Reads:** Server Components query the database directly — no client-side data-fetching library.
- **Writes:** Server Actions with Zod validation, session re-verification, and typed `Result` returns for expected failures.
- **Filter state:** The **URL** is the single source of truth. One Zod schema is shared between server (query building) and client (control rendering). Direct access, refresh, sharing, and the back button work without rehydration.
- **Optimistic updates:** `useOptimistic` for status/assignee changes; React reverts automatically when a transition fails.

### Performance

- Filtering, sorting, and pagination run in SQL; the client receives one page (10–100 rows).
- Keyset pagination on indexed `(updated_at, id)` instead of deep `OFFSET` scans.
- FTS5 full-text search; composite indexes matched to filter/sort combinations.
- Shared reference data cached with `use cache`; the request list is not cached (per-user, high-cardinality keys).
- Database seeded with 12,000 requests so scale behaviour is measured, not assumed.

### Application Structure

```
app/ (thin routes)  →  features/ (vertical slices)  →  server/services  →  server/repositories  →  server/db
                              ↘              lib/ (pure, no imports)              ↙
```

Authorization lives in a Data Access Layer that every read and write passes through — including Server Actions, which are reachable by direct `POST` regardless of page-level checks. The activity summary utility (`src/lib/summarize-activity/`) is pure and testable without framework dependencies; `/insights` surfaces its output.
