# As-Sunnah Desk — Architecture Documentation

Service Request Management Portal for As-Sunnah Foundation · Senior Frontend Practical Assessment

This folder is the design record for the portal. It is written to be read **before** the code exists, and to stay useful as the reference while the code is written.

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 01 | [Requirements traceability](./01-requirements-traceability.md) | Where is each assessment requirement satisfied, and how is it proven? |
| 02 | [Tech stack decisions](./02-tech-stack-decisions.md) | What are we building with, and what did we reject? |
| 03 | [System architecture](./03-system-architecture.md) | Layers, dependency rules, folder structure, request lifecycle. |
| 04 | [Data model and scale](./04-data-model-and-scale.md) | Schema, indexes, pagination and search at 10,000+ rows. |
| 05 | [Rendering and caching](./05-rendering-and-caching.md) | Server vs Client Components, Cache Components, PPR, prefetching. |
| 06 | [Auth and security](./06-auth-and-security.md) | Sessions, the Data Access Layer, authorization, CSP, rate limiting. |
| 07 | [Mutations and client state](./07-mutations-and-client-state.md) | Server Actions, optimistic updates, rollback, idempotency, concurrency. |
| 08 | [UI states and accessibility](./08-ui-states-and-accessibility.md) | Loading, empty, error, not-found; responsive and keyboard behaviour. |
| 09 | [Testing strategy](./09-testing-strategy.md) | What is unit tested, what is E2E tested, and why. |
| 10 | [Activity summary utility](./10-activity-summary-utility.md) | The per-assignee aggregation utility: contract and algorithm. |
| 11 | [Implementation roadmap](./11-implementation-roadmap.md) | Phased build order with a definition of done per phase. |
| 12 | [Technical note](./12-technical-note.md) | The short submission write-up. Start here if you only read one file. |
| 13 | [Next.js 16 reference](./13-nextjs-16-reference.md) | Version-specific API facts that differ from Next.js 14/15. |
| 14 | [UI component plan](./14-ui-component-plan.md) | Required shadcn primitives, feature components, and phase checklist. |
| 15 | [Local setup](./15-local-setup.md) | Env vars, `db:*` scripts, test credentials, routes, CI workflow. |
| 16 | [Test guidelines](./16-test-guidelines.md) | Engineering standards: AAA, factories, isolation, POM, flakiness prevention. |
| 17 | [UI design guidelines](./17-ui-design-guidelines.md) | Colour (60-30-10), typography, spacing, tokens, predefined block composition, and visual rules. |
| 18 | [Security guidelines](./18-security-guidelines.md) | Engineering standards: API entry points (Actions, reads, Route Handlers), OWASP mapping, PR checklist, incident response. |

## The short version

A Next.js 16 App Router application, TypeScript strict, with no separate backend. Data lives in a local SQLite database accessed through Drizzle ORM, seeded with 10,000+ service requests so that scale behaviour is real rather than claimed.

Reads are server-rendered: the request list and detail pages are Server Components that query the database directly, with the URL as the single source of truth for search, filter, sort and pagination state. Writes go through Server Actions that validate input with Zod, re-verify the session, enforce a status state machine, guard against duplicate submissions with an idempotency key, and guard against lost updates with an optimistic-concurrency version check. The client gets an optimistic update that rolls back automatically if the action fails.

Client-side JavaScript is deliberately small. Only the pieces that need interactivity — debounced search, filter bar, page-size select, row/detail update controls, user menu, toasts — are Client Components. Everything else, including the table body, stays on the server. Full list: [14 · Client JavaScript budget](./14-ui-component-plan.md#client-javascript-budget).

## Conventions used in these documents

- **Decision** blocks record a choice, its rationale, and what was rejected. They are the parts worth arguing with.
- **Trade-off** blocks record something we knowingly gave up. There are several; a design with none is a design that has not been thought about.
- Code in these documents is illustrative and shows intended shape and API usage. It is not a substitute for the implementation.
- Every Next.js API used here was verified against the bundled documentation in `node_modules/next/dist/docs/` for the exact installed version (16.3.5). See [13-nextjs-16-reference.md](./13-nextjs-16-reference.md), because several APIs changed names or signatures in version 16.
