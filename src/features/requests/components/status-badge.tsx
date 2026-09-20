import { Badge } from '@/components/ui/badge'
import { statusLabel } from '@/features/requests/lib/labels'
import type { RequestStatus } from '@/lib/search-params/request-enums'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<RequestStatus, string> = {
  new: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  in_review: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100',
  in_progress: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
  on_hold: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  resolved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  rejected: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
  closed: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
}

type StatusBadgeProps = {
  status: RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('border-transparent', STATUS_STYLES[status])}>
      {statusLabel(status)}
    </Badge>
  )
}
