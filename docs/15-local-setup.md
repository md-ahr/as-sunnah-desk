# 15 · Local Setup

Environment variables, database scripts, seeded test accounts, and CI — everything needed to run and verify the project locally. The assessment deliverable requires a README with setup instructions and test credentials; this document is the source of truth those files copy from.

---

## Environment variables

Parsed once at startup in `src/server/env.ts` with Zod. A missing or invalid variable fails immediately, not on first login.

| Variable           | Required | Default              | Purpose                                                                                         |
| ------------------ | -------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`     | No       | `file:./data/app.db` | libSQL / SQLite file path. Relative to project root.                                            |
| `SESSION_PASSWORD` | **Yes**  | —                    | iron-session seal password. **Minimum 32 characters.** Generate with `openssl rand -base64 32`. |
| `NODE_ENV`         | No       | `development`        | Set by Next.js. Affects cookie `secure` flag (see [06](./06-auth-and-security.md#sessions)).    |

`.env.example` (committed):

```env
DATABASE_URL=file:./data/app.db
SESSION_PASSWORD=replace-with-openssl-rand-base64-32-min-32-chars
```

`.env` and `.env.local` are gitignored. Never commit real secrets.

`src/server/env.ts` shape:

```ts
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./data/app.db'),
  SESSION_PASSWORD: z.string().min(32, 'SESSION_PASSWORD must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
```

Import `env` for its side effect in `src/server/env.ts` from the root layout or a dedicated `instrumentation.ts` so misconfiguration surfaces at boot.

---

## Database scripts

All scripts live in `package.json` and operate on `DATABASE_URL`.

| Script        | Command                                                | When to use                                                                                     |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `db:generate` | `drizzle-kit generate`                                 | After changing `src/server/db/schema.ts` — creates SQL migration files in `drizzle/`.           |
| `db:migrate`  | `drizzle-kit migrate`                                  | Apply pending migrations to the database file.                                                  |
| `db:push`     | `drizzle-kit push`                                     | **Dev only** — push schema directly without a migration. Do not use for the committed workflow. |
| `db:seed`     | `tsx src/server/db/seed.ts`                            | Populate 12,000 requests + reference data. Idempotent: truncates and re-seeds.                  |
| `db:studio`   | `drizzle-kit studio`                                   | Visual browser UI for inspecting data during development.                                       |
| `db:reset`    | `rm -f data/app.db && pnpm db:migrate && pnpm db:seed` | Fresh database from migrations + seed.                                                          |

**First-time setup:**

```bash
cp .env.example .env
# Edit SESSION_PASSWORD (32+ chars)
pnpm install
pnpm lefthook install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The `data/` directory is gitignored. Migrations in `drizzle/` are committed.

---

## Seeded test accounts

Every signed-in user can review and update every request. The brief asks for authentication, not separate roles.

Use this account for local development and E2E:

| Email                 | Password     |
| --------------------- | ------------ |
| `admin@assunnah.test` | `test.admin` |

The seed also inserts staff records used as requesters and assignees (`manager@assunnah.test` / `test.manager`, `agent@assunnah.test` / `test.agent`, `viewer@assunnah.test` / `test.viewer`). Those accounts can sign in, and they have the same access. Passwords are hashed with Argon2id at seed time. **Local development and E2E only.**

Fixed user ids (stable for tests and foreign keys): `user_admin`, `user_manager`, `user_agent`, `user_viewer`.

**E2E fixture record:** `SR-2026-000142` — a request with a known reference, used in mutation specs. Mutation tests use the reserved block `SR-2026-0009xx` so parallel specs do not collide ([09](./09-testing-strategy.md#test-data)).

---

## Seeded categories

Twelve fixed categories are inserted by `seed.ts`. Filter URLs use the **slug** column (`?category=it-support`); `service_requests.category_id` stores the internal **id**.

| Name                  | Slug (URL)       | `categories.id` (FK) |
| --------------------- | ---------------- | -------------------- |
| IT Support            | `it-support`     | `cat_it_support`     |
| Facilities            | `facilities`     | `cat_facilities`     |
| Human Resources       | `hr`             | `cat_hr`             |
| Finance & Payroll     | `finance`        | `cat_finance`        |
| Procurement           | `procurement`    | `cat_procurement`    |
| Events & Programs     | `events`         | `cat_events`         |
| Communications        | `communications` | `cat_communications` |
| Building Maintenance  | `maintenance`    | `cat_maintenance`    |
| Security & Access     | `security`       | `cat_security`       |
| Transport & Logistics | `transport`      | `cat_transport`      |
| Legal & Compliance    | `legal`          | `cat_legal`          |
| General Enquiries     | `general`        | `cat_general`        |

`lib/search-params/categories.ts` exports `CATEGORY_SLUGS` from this table so the Zod schema and filter UI stay in sync with the seed.

---

## Seed volume

| Table                | Rows       | Notes                                            |
| -------------------- | ---------- | ------------------------------------------------ |
| `users`              | 60         | 4 fixed accounts above + 56 generated            |
| `categories`         | 12         | Fixed rows above — slugs in URL, ids as FK       |
| `service_requests`   | **12,000** | Deliberately above the brief's 10,000+ threshold |
| `request_activities` | ~48,000    | 2–8 per request, chronologically consistent      |

Detail: [04 · Data model and scale](./04-data-model-and-scale.md#seeding).

---

## CI workflow

`pnpm verify` is the single quality gate. CI runs the same command on every push:

```yaml
# .github/workflows/verify.yml (Phase 0)
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
        env:
          SESSION_PASSWORD: ci-session-password-at-least-32-chars-long
          DATABASE_URL: file:./data/app.db
```

`verify` order: `typecheck` → `lint` → `knip` → `test:run` → `build` → `test:e2e` (production build). E2E seeds the database in global setup before specs run.

Local hooks (Lefthook) run a **subset**: pre-commit = lint-staged; pre-push = typecheck + unit tests. Full `verify` is CI and pre-submission.

---

## Routes reference

| Route            | Auth      | Purpose                                                                                                                    |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/login`         | Public    | Login form                                                                                                                 |
| `/requests`      | Protected | Dashboard (default landing after login)                                                                                    |
| `/requests/[id]` | Protected | Request detail + activity + assignee update. Segment value is the **reference** (`SR-2026-000142`), not the surrogate UUID |
| `/insights`      | Protected | Per-assignee summary table                                                                                                 |
| `/api/health`    | Public    | Health check (`{ status: 'ok' }`)                                                                                          |

`proxy.ts` redirects unauthenticated users to `/login?next=<path>`. Root `/` redirects to `/requests`.
