import { Skeleton } from '@/components/ui/skeleton'
import { ActivityTimelineSkeleton } from '@/features/activity/components/activity-timeline-skeleton'

export function RequestDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-40" />
      <section className="border-border bg-card rounded-lg border p-6" aria-label="Loading request">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-3/4 max-w-xl" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <ActivityTimelineSkeleton />
    </div>
  )
}
