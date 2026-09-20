<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

As-Sunnah Desk — service request portal. Architecture: thin routes → feature slices → `server/services` → repositories → SQLite. `lib/` is pure.

- Specs: `docs/README.md` · roadmap: `docs/11-implementation-roadmap.md`
- Quality gate: `pnpm verify`
- Stack: Next.js 16.3.5, React 19, Cache Components, shadcn/ui on Base UI, Drizzle + libSQL
