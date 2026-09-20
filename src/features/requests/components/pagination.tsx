import Link from 'next/link'

import { toRoute } from '@/lib/routes'
import type { SearchParams } from '@/lib/search-params/schema'
import { serialiseSearchParams, withSearchParams } from '@/lib/search-params/schema'
import { cn } from '@/lib/utils'

type PaginationProps = {
  params: SearchParams
  hasNextPage: boolean
  nextCursor: string | null
  total: number | `${number}+`
}

function pageCount(total: number | `${number}+`, perPage: number): number {
  if (typeof total === 'string') return 20
  return Math.min(20, Math.max(1, Math.ceil(total / perPage)))
}

export function Pagination({ params, hasNextPage, nextCursor, total }: PaginationProps) {
  const pages = pageCount(total, params.perPage)
  const currentPage = params.cursor ? undefined : params.page

  const prevHref =
    params.cursor || params.page > 1
      ? `/requests?${serialiseSearchParams(
          withSearchParams(params, {
            cursor: undefined,
            page: params.page > 1 ? params.page - 1 : 1,
          }),
        )}`
      : null

  const nextHref =
    hasNextPage && nextCursor
      ? `/requests?${serialiseSearchParams(
          withSearchParams(params, { cursor: nextCursor, page: undefined }),
        )}`
      : hasNextPage && currentPage !== undefined && currentPage < pages
        ? `/requests?${serialiseSearchParams(withSearchParams(params, { page: currentPage + 1 }))}`
        : null

  if (!prevHref && !nextHref && pages <= 1) {
    return null
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {prevHref ? (
          <Link
            href={toRoute(prevHref)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm hover:bg-muted"
            rel="prev"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground',
            )}
          >
            Previous
          </span>
        )}
        {nextHref ? (
          <Link
            href={toRoute(nextHref)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm hover:bg-muted"
            rel="next"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground"
          >
            Next
          </span>
        )}
      </div>

      {!params.cursor && pages > 1 && (
        <ol className="flex flex-wrap items-center gap-1">
          {Array.from({ length: pages }, (_, index) => {
            const page = index + 1
            const href = `/requests?${serialiseSearchParams(withSearchParams(params, { page }))}`
            const isCurrent = page === params.page

            return (
              <li key={page}>
                {isCurrent ? (
                  <span
                    aria-current="page"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary px-3 text-sm text-primary-foreground"
                  >
                    {page}
                  </span>
                ) : (
                  <Link
                    href={toRoute(href)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm hover:bg-muted"
                  >
                    {page}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </nav>
  )
}
