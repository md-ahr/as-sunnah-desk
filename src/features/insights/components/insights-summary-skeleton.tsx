import { Skeleton } from '@/components/ui/skeleton'

export function InsightsSummarySkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading insights">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="border-border rounded-lg border px-4 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      <section className="border-border bg-card overflow-hidden rounded-lg border">
        <div className="border-border border-b px-4 py-4 sm:px-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-0">
          <div className="bg-muted/40 h-10 border-b" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="border-border h-14 border-b last:border-b-0" />
          ))}
        </div>
      </section>
    </div>
  )
}
