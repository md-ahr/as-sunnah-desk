import { pageItemRange, totalPages } from '@/features/requests/lib/pagination-model'
import type { SearchParams } from '@/lib/search-params/schema'

type ResultRangeProps = {
  params: SearchParams
  total: number
}

export function ResultRange({ params, total }: ResultRangeProps) {
  const pages = totalPages(total, params.perPage)
  const currentPage = Math.min(Math.max(1, params.page), pages)
  const { start, end } = pageItemRange(currentPage, params.perPage, total)

  return (
    <p className="text-muted-foreground text-sm tabular-nums">
      Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
    </p>
  )
}
