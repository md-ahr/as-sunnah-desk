export type PageToken = number | 'ellipsis'

function range(start: number, end: number): number[] {
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function appendGroup(tokens: PageToken[], group: readonly number[]): PageToken[] {
  const first = group[0]
  if (first === undefined) return tokens

  const next = [...tokens]
  const last = next.at(-1)

  if (typeof last !== 'number') {
    next.push(...group)
    return next
  }

  const gap = first - last
  if (gap <= 1) {
    next.push(...group.filter((page) => page > last))
    return next
  }

  if (gap === 2) {
    next.push(last + 1, ...group)
    return next
  }

  next.push('ellipsis', ...group)
  return next
}

/**
 * Page links for a bounded pager.
 * Early pages keep the first five numbers plus a couple ahead of the current page:
 * 1 2 3 4 5 6 7 … 16 17 18 19 20
 * Late pages mirror that on the trailing edge. The current page stays visible in the middle.
 */
export function pageWindow(current: number, total: number): PageToken[] {
  if (total < 1) return []

  const page = Math.min(Math.max(1, current), total)
  if (total <= 10) return range(1, total)

  const edge = 5
  if (page <= edge) {
    const headEnd = Math.max(edge, page + 2)
    return appendGroup(range(1, headEnd), range(total - edge + 1, total))
  }

  if (page > total - edge) {
    const tailStart = Math.min(total - edge + 1, page - 2)
    return appendGroup(range(1, edge), range(tailStart, total))
  }

  return appendGroup(appendGroup([1, 2], range(page - 1, page + 1)), [total - 1, total])
}
