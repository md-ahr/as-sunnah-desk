import { Skeleton } from '@/components/ui/skeleton'

export function ActivityTimelineSkeleton() {
  return (
    <section className="border-border bg-card rounded-lg border" aria-label="Loading activity">
      <div className="border-border border-b px-6 py-4">
        <Skeleton className="h-5 w-20" />
      </div>
      <ol className="space-y-0 p-6">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="relative pb-6 pl-8 last:pb-0">
            <Skeleton className="absolute top-1 left-0 size-3.5 rounded-full" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
            <Skeleton className="mt-2 h-3 w-24" />
          </li>
        ))}
      </ol>
    </section>
  )
}
