'use client'

import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { Button } from '@/components/ui/button'
import { toRoute } from '@/lib/routes'

type ActiveFilterChipProps = {
  label: string
  param: 'status' | 'priority' | 'category' | 'assignee'
  value: string
}

export function ActiveFilterChip({ label, param, value }: ActiveFilterChipProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, startNavigation } = useDashboardNavigation()

  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5"
        disabled={isPending}
        aria-label={`Remove ${label} filter`}
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString())
          const values = params.getAll(param).filter((entry) => entry !== value)
          params.delete(param)
          for (const entry of values) {
            params.append(param, entry)
          }
          params.delete('cursor')
          params.delete('page')
          params.delete('seek')

          startNavigation(() => {
            const query = params.toString()
            router.replace(toRoute(query ? `${pathname}?${query}` : pathname), { scroll: false })
          })
        }}
      >
        <X className="size-3" aria-hidden="true" />
      </Button>
    </Badge>
  )
}
