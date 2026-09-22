import Link from 'next/link'

import { toRoute } from '@/lib/routes'
import type { SortKey } from '@/lib/search-params/cursor'
import type { SearchParams } from '@/lib/search-params/schema'
import { serialiseSearchParams, withSearchParams } from '@/lib/search-params/schema'
import { cn } from '@/lib/utils'

type SortLinkProps = {
  sortKey: SortKey
  currentSort: SortKey
  params: SearchParams
  children: React.ReactNode
  className?: string
}

function nextSort(current: SortKey, target: SortKey): SortKey {
  if (current === target && target.endsWith('_desc')) {
    return target.replace('_desc', '_asc') as SortKey
  }
  return target
}

export function SortLink({ sortKey, currentSort, params, children, className }: SortLinkProps) {
  const href = `/requests?${serialiseSearchParams(
    withSearchParams(params, { sort: nextSort(currentSort, sortKey) }),
  )}`

  const isDesc = currentSort === sortKey
  const isAsc = currentSort === sortKey.replace('_desc', '_asc')

  return (
    <Link
      href={toRoute(href)}
      className={cn('inline-flex items-center gap-1 hover:underline', className)}
    >
      {children}
      {isDesc ? (
        <span aria-hidden="true">↓</span>
      ) : isAsc ? (
        <span aria-hidden="true">↑</span>
      ) : (
        <span aria-hidden="true" className="text-muted-foreground/70">
          ↕
        </span>
      )}
    </Link>
  )
}
