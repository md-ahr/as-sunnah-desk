import { Badge } from '@/components/ui/badge'
import { priorityLabel } from '@/features/requests/lib/labels'
import type { RequestPriority } from '@/lib/search-params/request-enums'
import { cn } from '@/lib/utils'

const PRIORITY_DOTS: Record<RequestPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

const PRIORITY_STYLES: Record<RequestPriority, string> = {
  low: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
  medium: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100',
  high: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
  urgent: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
}

type PriorityBadgeProps = {
  priority: RequestPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const dots = PRIORITY_DOTS[priority]

  return (
    <Badge variant="outline" className={cn('gap-1.5 border-transparent', PRIORITY_STYLES[priority])}>
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {Array.from({ length: dots }, (_, index) => (
          <span key={index} className="size-1.5 rounded-full bg-current" />
        ))}
      </span>
      {priorityLabel(priority)}
    </Badge>
  )
}
