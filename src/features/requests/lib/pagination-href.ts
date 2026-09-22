import { pageTarget } from '@/features/requests/lib/pagination-model'
import type { SearchParams } from '@/lib/search-params/schema'
import { serialiseSearchParams, withSearchParams } from '@/lib/search-params/schema'

type PageCursors = {
  readonly next: string | null
  readonly previous: string | null
}

function requestsHref(query: string): string {
  return query ? `/requests?${query}` : '/requests'
}

/** URL for one pager control. Null when that page is not a single cheap seek. */
export function paginationHref(
  params: SearchParams,
  page: number,
  currentPage: number,
  totalPageCount: number,
  cursors: PageCursors,
): string | null {
  const target = pageTarget(page, currentPage, totalPageCount)

  switch (target) {
    case 'current':
    case 'unreachable':
      return null
    case 'offset':
      return requestsHref(
        serialiseSearchParams(
          withSearchParams(params, { page, cursor: undefined, seek: undefined }),
        ),
      )
    case 'end':
      return requestsHref(
        serialiseSearchParams(withSearchParams(params, { page, seek: 'end', cursor: undefined })),
      )
    case 'next':
      if (!cursors.next) return null
      return requestsHref(
        serialiseSearchParams(
          withSearchParams(params, { page, cursor: cursors.next, seek: undefined }),
        ),
      )
    case 'prev':
      if (!cursors.previous) return null
      return requestsHref(
        serialiseSearchParams(
          withSearchParams(params, { page, cursor: cursors.previous, seek: undefined }),
        ),
      )
  }
}
