import { RequestTableSkeleton } from '@/features/requests/components/request-table-skeleton'

export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <RequestTableSkeleton rows={10} />
    </div>
  )
}
