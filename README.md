# As-Sunnah Desk

Service request management portal for **As-Sunnah Foundation** — a Next.js 16 App Router application for tracking, searching, filtering, and updating service requests at scale.

## Stack

- Next.js 16 · React 19 · TypeScript (strict)
- SQLite + Drizzle ORM (12,000+ seeded requests)
- Server Components for reads · Server Actions for writes
- Tailwind CSS 4 · shadcn/ui

## Getting started

```bash
pnpm install
cp .env.example .env   # set SESSION_PASSWORD (min 32 chars)
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Test credentials and full setup: [docs/15-local-setup.md](./docs/15-local-setup.md).

## Documentation

Architecture and implementation details live in [`docs/`](./docs/README.md). Start with [docs/12-technical-note.md](./docs/12-technical-note.md) for the short overview, or [docs/README.md](./docs/README.md) for the full index.

## License

Private — As-Sunnah Foundation senior frontend practical assessment.
