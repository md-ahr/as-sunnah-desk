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
pnpm db:migrate   # Phase 1+ — after schema exists
pnpm db:seed      # Phase 1+ — populates 12,000 requests
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test credentials

Seeded in Phase 1 (`db:seed`). See [docs/15-local-setup.md](./docs/15-local-setup.md#seeded-test-accounts).

| Role | Email | Password |
| --- | --- | --- |
| admin | `admin@assunnah.test` | `test.admin` |
| manager | `manager@assunnah.test` | `test.manager` |
| agent | `agent@assunnah.test` | `test.agent` |
| viewer | `viewer@assunnah.test` | `test.viewer` |

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm verify` | Full quality gate (types, lint, knip, unit, build, e2e) |
| `pnpm test:run` | Unit and integration tests |
| `pnpm test:e2e` | Playwright against production build |
| `pnpm lint` | ESLint including architecture layer rules |
| `pnpm typecheck` | `next typegen` + TypeScript |

## Documentation

Implementation specs live in [`docs/`](./docs/README.md). Start with the [implementation roadmap](./docs/11-implementation-roadmap.md).

## Architecture

Four layers enforced by ESLint: routes → features → services → repositories → database. `lib/` is pure. See [docs/03-system-architecture.md](./docs/03-system-architecture.md).
