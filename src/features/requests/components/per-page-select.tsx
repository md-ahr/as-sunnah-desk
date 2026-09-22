'use client'

import { useRouter } from 'next/navigation'
import { useId } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { toRoute } from '@/lib/routes'
import type { SearchParams } from '@/lib/search-params/schema'
import { serialiseSearchParams, withSearchParams } from '@/lib/search-params/schema'

const PAGE_SIZES = [10, 25, 50, 100] as const

type PageSize = (typeof PAGE_SIZES)[number]

function isPageSize(value: string): value is `${PageSize}` {
  return (PAGE_SIZES as readonly number[]).some((size) => String(size) === value)
}

type PerPageSelectProps = {
  params: SearchParams
}

export function PerPageSelect({ params }: PerPageSelectProps) {
  const router = useRouter()
  const labelId = useId()
  const { startNavigation } = useDashboardNavigation()

  function onValueChange(value: string | null) {
    if (!value || !isPageSize(value)) return

    const perPage = Number(value) as PageSize
    if (perPage === params.perPage) return

    const query = serialiseSearchParams(withSearchParams(params, { perPage }))
    const href = query ? `/requests?${query}` : '/requests'

    startNavigation(() => {
      router.push(toRoute(href))
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span id={labelId} className="text-muted-foreground text-sm whitespace-nowrap">
        Items per page
      </span>
      <Select value={String(params.perPage)} onValueChange={onValueChange}>
        <SelectTrigger aria-labelledby={labelId} size="sm" className="w-19">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
