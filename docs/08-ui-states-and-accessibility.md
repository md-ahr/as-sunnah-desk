# 08 · UI States and Accessibility

The brief asks for "meaningful loading, empty, validation, success, error and not-found experiences instead of relying on default browser behavior." The word doing the work is *meaningful* — a spinner is a loading state, but it is rarely a meaningful one.

**Component inventory:** which shadcn primitives and feature components to build, mapped to each requirement, is in [14 · UI component plan](./14-ui-component-plan.md).

## Every state, enumerated

| State | Trigger | Treatment |
|---|---|---|
| Initial shell | Any navigation | Static shell: header, nav, filter bar, table skeleton — served immediately by PPR |
| Streaming data | Uncached query resolving | Skeleton matching real row geometry inside `<Suspense>` |
| Refining results | Filter or search change | **Previous results stay visible**, dimmed, with a spinner. Not replaced by a skeleton |
| Populated | Rows returned | The table |
| Empty — no data at all | Zero requests exist | Onboarding-style message; no "clear filters" offer, since none are applied |
| Empty — no matches | Filters exclude everything | Distinct message, echoes the active filters, offers "Clear all filters" |
| Validation error | Zod rejects input | Inline, next to the field, `aria-describedby`, `aria-invalid` |
| Conflict | Version mismatch | Toast with the current value and a "Reload" action |
| Permission denied | Capability check fails | Control rendered disabled with an explanatory tooltip; never a dead-end error |
| Action success | Mutation applied | Durable UI change **plus** a toast. The toast is supplementary |
| Recoverable error | Query or render throws | `error.tsx` with `retry()` |
| Fatal error | Root layout throws | `global-error.tsx` with its own `<html>` and `<body>` |
| Not found | Unknown or unauthorised id | Segment-scoped `not-found.tsx` with a route back |
| Offline | Network unavailable | Action failure is caught and reported as a connection problem, not a generic error |

### Loading: two different situations

Conflating these is the most common shortcut, and it produces a visibly worse experience:

**First load** has nothing to show, so a skeleton is right. It must match the real geometry — default page size (10 rows) at real row height, columns at real widths — so the arriving content causes no layout shift.

**Refining** already has valid content on screen. Replacing a populated table with a skeleton on every keystroke throws away useful information and makes the interface flicker. Instead, `useTransition` keeps the old results mounted while the new ones load:

```tsx
<div
  className={isPending ? 'opacity-60 transition-opacity' : undefined}
  aria-busy={isPending}
>
  {children}
</div>
```

`aria-busy` communicates the same thing non-visually that the opacity change communicates visually.

### Empty: two different situations

```tsx
// features/requests/components/empty-state.tsx
export function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  if (hasActiveFilters) {
    return (
      <div role="status" className="py-16 text-center">
        <h2 className="text-lg font-medium">No requests match these filters</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try removing a filter or widening your search.
        </p>
        <ClearFiltersButton className="mt-4" />
      </div>
    )
  }

  return (
    <div role="status" className="py-16 text-center">
      <h2 className="text-lg font-medium">No service requests yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Requests submitted by staff and stakeholders will appear here.
      </p>
    </div>
  )
}
```

A user who has filtered to nothing needs an escape route. A user with a genuinely empty queue needs reassurance that nothing is broken. One message cannot do both jobs, and offering "clear filters" when no filters are set is actively confusing.

`role="status"` announces the change to screen-reader users, who otherwise get silence when results disappear.

### Errors

```tsx
// app/(portal)/requests/error.tsx
'use client'

export default function RequestsError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-medium">We could not load requests</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This is usually temporary. Try again, or return to the dashboard.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={retry}>Try again</button>
        <Link href="/requests">Back to dashboard</Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-6 overflow-auto text-left text-xs">{error.message}</pre>
      )}
    </div>
  )
}
```

Three things here. `error.tsx` must be a Client Component. The prop is `retry` — stable since 16.3.0, replacing the `unstable_retry` prefix — and it re-fetches and re-renders, which is more useful than `reset`, which only clears the error. And the raw error message appears only in development; in production it would leak internals to users while telling them nothing actionable.

Boundaries are placed per segment, so a failing activity timeline shows its own error while the request details beside it remain usable. A single root boundary would take down the whole page for one failed query.

For component-level boundaries inside a page, `catchError` from `next/error` (stable in 16.3.0) is the mechanism — it is framework-aware, so it passes `redirect()` and `notFound()` through instead of swallowing them.

### Not found

```tsx
// app/(portal)/requests/[id]/not-found.tsx
export default function RequestNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-medium">Request not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        It may have been removed, or you may not have access to it.
      </p>
      <Link href="/requests" className="mt-4 inline-block">Back to all requests</Link>
    </div>
  )
}
```

The wording is deliberate. A request the user is not permitted to see returns the same not-found response as one that does not exist, so the page does not confirm the existence of records outside the user's scope.

One honest caveat, carried over from [03](./03-system-architecture.md#error-handling-architecture): under PPR the shell has already streamed with a 200 status by the time `notFound()` runs, so this renders not-found *UI* with a 200 *status*. Acceptable for an authenticated, `noindex` page. If a true 404 status were required, the existence check would have to move into `proxy.ts` before streaming starts.

## Responsive strategy

> **One DOM. CSS decides the layout. No JavaScript breakpoint detection.**

This matters beyond tidiness. A JS-driven layout switch means the server cannot know which layout to render, which produces either a hydration mismatch or a visible flash. It also means shipping a resize listener and re-rendering on every viewport change. Doing it in CSS avoids all of that, and the layout is correct in the very first byte of HTML.

| Breakpoint | Layout |
|---|---|
| `< 640px` | Card list. Filters collapse into a sheet. Each card shows subject, reference, status, priority, assignee, relative time |
| `640–1024px` | Table with lower-priority columns hidden via CSS (`hidden md:table-cell`) |
| `≥ 1024px` | Full table, all columns, sticky header |

The same `<tr>` becomes a card through CSS:

```css
@media (max-width: 639px) {
  .request-table thead { display: none; }
  .request-table tr {
    display: grid;
    grid-template-areas: "ref status" "subject subject" "meta meta";
    /* ... */
  }
  .request-table td[data-label]::before {
    content: attr(data-label) ": ";
    font-weight: 500;
  }
}
```

The `data-label` pseudo-element restores the column header as an inline label on mobile, where the `<thead>` is hidden. Without it, a card reads as a list of unlabelled values.

Touch targets are at least 44×44 px on small screens, and the filter sheet is a shadcn `Sheet` (Base UI `Dialog`) so focus is trapped and Escape closes it.

## Accessibility

### Semantic structure

The dashboard is a real table, because it is real tabular data. A grid of `<div>`s would look identical and be unusable with a screen reader, which relies on table semantics to announce "row 4 of 10, Status: In progress" (position reflects the current `perPage`).

```tsx
<table className="request-table w-full">
  <caption className="sr-only">
    Service requests, sorted by last updated, newest first. 247 results.
  </caption>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortFor('reference')}>
        <SortLink field="reference">ID</SortLink>
      </th>
      <th scope="col" aria-sort={sortFor('subject')}>Subject</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {rows.map((row) => (
      <tr key={row.id}>
        <th scope="row" data-label="ID">{row.reference}</th>
        <td data-label="Subject">{/* ... */}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

`<caption>` gives screen-reader users the context sighted users get from the heading and result count. `aria-sort` on the active column announces the sort direction, which is otherwise conveyed by an arrow icon alone. `<th scope="row">` on the reference cell means every other cell in the row is announced in relation to its identifier.

### Colour is never the only signal

Status and priority badges carry a text label in addition to colour. An "urgent" badge reads "Urgent", not just red. Roughly 8% of men have some form of colour vision deficiency, and a red/green status distinction is invisible to a meaningful share of them. Priority additionally carries a shape cue — a filled dot count — so the distinction survives greyscale printing.

All text meets WCAG AA contrast (4.5:1 for body, 3:1 for large text), verified against the Tailwind palette rather than assumed.

### Keyboard

| Target | Behaviour |
|---|---|
| Skip link | First focusable element, jumps to `<main>` |
| Search | Focusable; `/` focuses it from anywhere; Escape clears |
| Filter chips | Tab-reachable; Enter/Space toggles; Backspace removes |
| Sortable headers | Real links, so Enter works and they are Tab-reachable |
| Status menu | Base UI menu: Enter/Space opens, arrows move, Escape closes, focus returns to trigger |
| Assignee combobox | Type to filter, arrows navigate, Enter selects, Escape closes |
| Pagination | Real links |
| Filter sheet (mobile) | Focus trapped, Escape closes, focus restored on close |

Focus is visible everywhere via `:focus-visible` with a 2px ring at 3:1 contrast against both adjacent colours. Focus outlines are never removed — `outline: none` without a replacement is the single most common accessibility regression in React codebases.

Focus order follows DOM order, which follows visual order. This is a consequence of the CSS-only responsive approach: reordering with `order` or `grid-template-areas` can separate visual order from DOM order, so the mobile layout was designed to keep them aligned rather than needing `tabindex` to patch it.

### Announcements

Screen-reader users need to be told when content changes without a page load:

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isPending ? 'Loading results' : `${total} requests found`}
</div>
```

`polite` waits for a pause rather than interrupting. `aria-atomic` makes the whole message re-read rather than just the changed number, which otherwise announces a bare "247".

Action outcomes are announced too. `sonner` renders toasts into a live region, so "Status changed to In progress" is spoken. Because the toast is supplementary and the row itself changes, a user who misses the announcement still has the durable change.

### Forms

```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    name="email"
    type="email"
    autoComplete="email"
    aria-invalid={Boolean(error)}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && <p id="email-error" role="alert">{error}</p>}
</div>
```

Every input has a real `<label>` with `htmlFor` — placeholders are not labels; they vanish on focus and are not reliably announced. `aria-invalid` marks the field as errored, `aria-describedby` links the message so it is read when the field is focused, and `role="alert"` announces it on appearance. `autoComplete` lets password managers work, which is both a usability and a security improvement.

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Skeleton shimmer, toast entry, and menu transitions all respect this. For users with vestibular disorders, motion is not a nicety to opt out of.

## Verification

Accessibility is asserted, not assumed:

| Check | Tool | Scope |
|---|---|---|
| Automated rule violations | `jest-axe` | Every component test |
| Automated, full page | `@axe-core/playwright` | Login, dashboard, detail, empty state |
| Keyboard-only traversal | Playwright, `keyboard.press` only | Login → filter → open request → change status |
| Focus management | Playwright asserting `document.activeElement` | Menu open/close, sheet open/close |
| Contrast | Manual audit against the token palette | All badge and text combinations |
| Screen reader | Manual: VoiceOver on Safari, NVDA on Firefox | Dashboard and detail |

The manual screen-reader pass is not redundant. Automated tools catch missing labels and bad contrast; they cannot tell you that a table announces in a confusing order or that an announcement arrives too late to be useful. The Next.js docs themselves recommend Firefox with NVDA, or Safari with VoiceOver.

## Performance as a user experience concern

These are UX targets, not just metrics:

| Metric | Target | How this design achieves it |
|---|---|---|
| LCP | < 1.5 s local | Static shell served immediately by PPR |
| CLS | < 0.05 | Skeletons match real geometry; no JS layout switching |
| INP | < 200 ms | Minimal client JS; optimistic updates make interactions feel instant |
| Client JS per route | Kept small | Server Components by default; client islands only where needed |

The three largest contributors: the table body ships no client JavaScript, the responsive layout is pure CSS so there is no layout-shift-inducing hydration, and `useOptimistic` means the interface responds before the network does.
