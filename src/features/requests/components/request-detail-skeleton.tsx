import { Skeleton } from '@/components/ui/skeleton'
import { ActivityTimelineSkeleton } from '@/features/activity/components/activity-timeline-skeleton'

export function RequestDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />
      <section className="border-border bg-card rounded-lg border" aria-label="Loading request">
        <div className="space-y-4 p-6 pb-0">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-3/4 max-w-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="border-border my-6 border-t" />
        <div className="grid grid-cols-1 gap-8 px-6 pb-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="bg-muted/40 border-border/60 space-y-5 rounded-md border p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <ActivityTimelineSkeleton />
    </div>
  )
}
