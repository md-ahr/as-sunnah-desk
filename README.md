# As-Sunnah Desk

Service request management portal for As-Sunnah Foundation — built on Next.js 16, React 19, SQLite, and shadcn/ui on Base UI.

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 11+

## Setup

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

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | No | `file:./data/app.db` | SQLite file path (relative to project root) |
| `SESSION_PASSWORD` | **Yes** | — | iron-session seal password (minimum 32 characters) |
| `NODE_ENV` | No | `development` | Set by Next.js; affects cookie `secure` flag |

`.env` and `.env.local` are gitignored. Never commit real secrets.

## Test credentials

Four seeded accounts — one per role. **Local development and E2E only.**

| Role | Email | Password |
| --- | --- | --- |
| admin | `admin@assunnah.test` | `test.admin` |
| manager | `manager@assunnah.test` | `test.manager` |
| agent | `agent@assunnah.test` | `test.agent` |
| viewer | `viewer@assunnah.test` | `test.viewer` |

Full capability matrix: [docs/15-local-setup.md](./docs/15-local-setup.md#seeded-test-accounts).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm verify` | Full quality gate (types, lint, knip, unit, build, e2e) |
| `pnpm test:run` | Unit and integration tests |
| `pnpm test:e2e` | Playwright against production build |
| `pnpm lint` | ESLint including architecture layer rules |
| `pnpm typecheck` | `next typegen` + TypeScript |
| `pnpm knip` | Unused dependency and orphan file check |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Populate 12,000 requests + reference data |
| `pnpm db:reset` | Delete database, migrate, and re-seed |
| `pnpm db:studio` | Drizzle Studio browser UI |

## Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `/login` | Public | Login form |
| `/requests` | Protected | Dashboard (default landing after login) |
| `/requests/[id]` | Protected | Request detail + activity (reference in URL, e.g. `SR-2026-000142`) |
| `/insights` | Protected | Per-assignee summary table |
| `/api/health` | Public | Health check (`{ status: 'ok' }`) |

## Troubleshooting

**App fails to start with a `SESSION_PASSWORD` error** — ensure `.env` exists and the value is at least 32 characters.

**Empty dashboard after setup** — run `pnpm db:migrate` then `pnpm db:seed`. The seed is idempotent and truncates before re-inserting.

**E2E tests fail locally** — run `pnpm verify` (not `pnpm test:e2e` alone). E2E runs against a production build and seeds the database in global setup.

**`pnpm db:migrate` fails on a fresh clone** — create the data directory with `mkdir -p data`, or run `pnpm db:reset`.

**Port 3000 in use** — start on another port: `pnpm dev --port 3001`.

## Documentation

Implementation specs live in [`docs/`](./docs/README.md):

- [Implementation roadmap](./docs/11-implementation-roadmap.md)
- [Technical note](./docs/12-technical-note.md) — architecture decisions for submission
- [Local setup](./docs/15-local-setup.md) — env vars, seed data, CI

## Architecture

Four layers enforced by ESLint: routes → features → services → repositories → database. `lib/` is pure. See [docs/03-system-architecture.md](./docs/03-system-architecture.md).

## Extension points

Deliberate future work, not oversights:

- **PostgreSQL** — swap `src/server/db/client.ts`; move FTS to `tsvector`. Repository signatures unchanged.
- **Database-backed sessions** — `sessions` table enables server-side revocation. One function in the DAL changes.
- **Real-time updates** — SSE or polling with `refresh()`. Would justify TanStack Query.
- **Redis rate limiting** — replace in-memory limiter behind existing interface.
- **Bulk actions** — idempotency and concurrency primitives already support them; UI missing.
- **Nonce-based CSP** — if `experimental.sri` stabilises.
