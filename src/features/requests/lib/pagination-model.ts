import { pageWindow } from '@/features/requests/lib/page-window'
import { OFFSET_PAGE_LIMIT } from '@/lib/pagination/constants'

export { OFFSET_PAGE_LIMIT }

export type PageTarget = 'current' | 'offset' | 'next' | 'prev' | 'end' | 'unreachable'

export type PaginationToken = { type: 'page'; page: number; linked: boolean } | { type: 'ellipsis' }

export function totalPages(total: number, perPage: number): number {
  if (total < 1) return 1
  return Math.ceil(total / perPage)
}

export function pageItemRange(
  currentPage: number,
  perPage: number,
  total: number,
): { readonly start: number; readonly end: number } {
  if (total < 1) {
    return { start: 0, end: 0 }
  }

  const start = (currentPage - 1) * perPage + 1
  const end = Math.min(currentPage * perPage, total)
  return { start, end }
}

/**
 * How to open a page without an unbounded OFFSET.
 * Pages 1–20 are an offset. The immediate neighbour uses the keyset cursor.
 * The last page is a reverse seek. Anything else is not a single hop.
 */
export function pageTarget(
  page: number,
  currentPage: number,
  totalPageCount: number,
  offsetLimit = OFFSET_PAGE_LIMIT,
): PageTarget {
  if (page === currentPage) return 'current'
  if (page < 1 || page > totalPageCount) return 'unreachable'
  if (page <= Math.min(offsetLimit, totalPageCount)) return 'offset'
  if (page === totalPageCount) return 'end'
  if (page === currentPage + 1) return 'next'
  if (page === currentPage - 1) return 'prev'
  return 'unreachable'
}

function isPageNavigable(
  page: number,
  currentPage: number,
  totalPageCount: number,
  offsetLimit: number,
): boolean {
  const target = pageTarget(page, currentPage, totalPageCount, offsetLimit)
  return target === 'offset' || target === 'next' || target === 'prev' || target === 'end'
}

function mapWindow(tokens: readonly (number | 'ellipsis')[], linked: boolean): PaginationToken[] {
  return tokens.map((token) =>
    token === 'ellipsis' ? { type: 'ellipsis' } : { type: 'page', page: token, linked },
  )
}

function appendTotalPage(
  tokens: PaginationToken[],
  totalPageCount: number,
  lastWindowPage: number,
): PaginationToken[] {
  if (lastWindowPage >= totalPageCount) return tokens

  const next = [...tokens]
  if (lastWindowPage < totalPageCount - 1) {
    next.push({ type: 'ellipsis' })
  }
  next.push({ type: 'page', page: totalPageCount, linked: true })
  return next
}

/** Late offset pages when the dataset extends beyond the linkable range. */
function offsetTailTokens(
  page: number,
  linkedLimit: number,
  totalPageCount: number,
): PaginationToken[] {
  const tokens: PaginationToken[] = [{ type: 'page', page: 1, linked: true }]
  const windowStart = Math.max(2, page - 2)

  if (windowStart > 2) {
    tokens.push({ type: 'ellipsis' })
  }

  for (let p = windowStart; p <= page; p += 1) {
    tokens.push({ type: 'page', page: p, linked: true })
  }

  if (page < linkedLimit) {
    for (let p = page + 1; p <= linkedLimit; p += 1) {
      tokens.push({ type: 'page', page: p, linked: true })
    }
  } else if (page === linkedLimit && page < totalPageCount) {
    tokens.push({
      type: 'page',
      page: page + 1,
      linked: isPageNavigable(page + 1, page, totalPageCount, linkedLimit),
    })
  }

  const lastWindowPage = page < linkedLimit ? linkedLimit : page + 1
  return appendTotalPage(tokens, totalPageCount, lastWindowPage)
}

/**
 * Numbered pager for a large list.
 * Pages 1–20 stay offset links. Past that, the window is the standard
 * first / neighbours / last pattern, and every shown number is one cheap seek.
 */
export function paginationTokens(
  currentPage: number,
  totalPageCount: number,
  offsetLimit = OFFSET_PAGE_LIMIT,
): PaginationToken[] {
  if (totalPageCount <= 1) return []

  const page = Math.min(Math.max(1, currentPage), totalPageCount)
  const linkedLimit = Math.min(offsetLimit, totalPageCount)

  if (totalPageCount <= linkedLimit) {
    return mapWindow(pageWindow(page, totalPageCount), true)
  }

  if (page <= linkedLimit) {
    const tailFocusStart = linkedLimit - 4

    if (totalPageCount > linkedLimit && page >= tailFocusStart) {
      return offsetTailTokens(page, linkedLimit, totalPageCount)
    }

    const window = pageWindow(page, linkedLimit)
    const last =
      window.filter((token): token is number => token !== 'ellipsis').at(-1) ?? linkedLimit
    return appendTotalPage(mapWindow(window, true), totalPageCount, last)
  }

  const tokens: PaginationToken[] = [{ type: 'page', page: 1, linked: true }]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPageCount, page + 1)

  if (start > 2) {
    tokens.push({ type: 'ellipsis' })
  }

  for (let p = start; p <= end; p += 1) {
    tokens.push({
      type: 'page',
      page: p,
      linked: isPageNavigable(p, page, totalPageCount, offsetLimit),
    })
  }

  return appendTotalPage(tokens, totalPageCount, end)
}
