'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { toRoute } from '@/lib/routes'
import { cn } from '@/lib/utils'

type ClearFiltersButtonProps = {
  className?: string
}

export function ClearFiltersButton({ className }: ClearFiltersButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isPending, startNavigation } = useDashboardNavigation()

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(className)}
      disabled={isPending}
      onClick={() => {
        startNavigation(() => {
          router.replace(toRoute(pathname), { scroll: false })
        })
      }}
    >
      Clear all filters
    </Button>
  )
}
