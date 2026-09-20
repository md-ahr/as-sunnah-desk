import { Skeleton } from '@/components/ui/skeleton'

export function ActivityTimelineSkeleton() {
  return (
    <section className="border-border bg-card rounded-lg border p-6" aria-label="Loading activity">
      <Skeleton className="h-6 w-28" />
      <ol className="mt-4 space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="space-y-2 pl-6">
            <Skeleton className="h-4 w-3/4 max-w-md" />
            <Skeleton className="h-3 w-24" />
          </li>
        ))}
      </ol>
    </section>
  )
}
