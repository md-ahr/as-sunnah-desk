import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

import { paginationHref } from '@/features/requests/lib/pagination-href'
import { paginationTokens, totalPages } from '@/features/requests/lib/pagination-model'
import { toRoute } from '@/lib/routes'
import type { SearchParams } from '@/lib/search-params/schema'
import { cn } from '@/lib/utils'

type PaginationProps = {
  params: SearchParams
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextCursor: string | null
  previousCursor: string | null
  total: number
}

const controlBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition-colors sm:h-8 sm:min-w-8'

function isCompactVisiblePage(page: number, currentPage: number, totalPageCount: number): boolean {
  if (page === currentPage) return true
  if (page === 1 || page === totalPageCount) return true
  if (Math.abs(page - currentPage) <= 1) return true
  return false
}

export function Pagination({
  params,
  hasNextPage,
  hasPreviousPage,
  nextCursor,
  previousCursor,
  total,
}: PaginationProps) {
  const pages = totalPages(total, params.perPage)
  const currentPage = Math.min(Math.max(1, params.page), pages)
  const tokens = paginationTokens(currentPage, pages)
  const cursors = {
    next: hasNextPage ? nextCursor : null,
    previous: hasPreviousPage ? previousCursor : null,
  }

  function hrefFor(page: number): string | null {
    return paginationHref(params, page, currentPage, pages, cursors)
  }

  const prevHref = currentPage > 1 ? hrefFor(currentPage - 1) : null
  const nextHref = currentPage < pages ? hrefFor(currentPage + 1) : null

  if (pages <= 1) {
    return null
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-2 lg:w-auto lg:items-end">
      <nav aria-label="Pagination">
        <ul className="flex flex-nowrap items-center justify-center gap-1 lg:justify-end">
          <li>
            {prevHref ? (
              <Link
                href={toRoute(prevHref)}
                aria-label="Previous page"
                className={cn(controlBase, 'border-border hover:bg-muted')}
                rel="prev"
              >
                <ChevronLeftIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span
                role="button"
                aria-disabled="true"
                aria-label="Previous page"
                className={cn(controlBase, 'border-border text-muted-foreground')}
              >
                <ChevronLeftIcon aria-hidden="true" className="size-4" />
              </span>
            )}
          </li>

          {tokens.map((token, index) => {
            if (token.type === 'ellipsis') {
              return (
                <li
                  key={`ellipsis-${String(index)}`}
                  aria-hidden="true"
                  className="text-muted-foreground hidden px-0.5 text-sm lg:list-item"
                >
                  …
                </li>
              )
            }

            const label = token.page.toLocaleString()
            const compactClass = cn(
              !isCompactVisiblePage(token.page, currentPage, pages) && 'max-lg:hidden',
            )

            if (token.page === currentPage) {
              return (
                <li key={token.page} className={compactClass}>
                  <span
                    aria-current="page"
                    className={cn(
                      controlBase,
                      'border-primary bg-primary text-primary-foreground font-medium',
                    )}
                  >
                    {label}
                  </span>
                </li>
              )
            }

            const href = hrefFor(token.page)

            if (!href) {
              return (
                <li key={token.page} className={compactClass}>
                  <span className={cn(controlBase, 'border-border text-muted-foreground')}>
                    {label}
                  </span>
                </li>
              )
            }

            return (
              <li key={token.page} className={compactClass}>
                <Link
                  href={toRoute(href)}
                  aria-label={`Page ${label}`}
                  className={cn(controlBase, 'border-border hover:bg-muted')}
                >
                  {label}
                </Link>
              </li>
            )
          })}

          <li>
            {nextHref ? (
              <Link
                href={toRoute(nextHref)}
                aria-label="Next page"
                className={cn(controlBase, 'border-border hover:bg-muted')}
                rel="next"
              >
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span
                role="button"
                aria-disabled="true"
                aria-label="Next page"
                className={cn(controlBase, 'border-border text-muted-foreground')}
              >
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </div>
  )
}
