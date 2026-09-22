import { Skeleton } from '@/components/ui/skeleton'

export function PortalHeaderSkeleton() {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto grid h-14 max-w-[90rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
          <Skeleton className="h-8 w-12 shrink-0" aria-hidden />
          <Skeleton className="hidden h-4 w-28 sm:block" aria-hidden />
        </div>
        <div className="bg-muted border-border flex items-center gap-0.5 rounded-lg border p-1">
          <Skeleton className="h-8 w-[6.5rem] rounded-md" />
          <Skeleton className="h-8 w-[5.75rem] rounded-md" />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end">
          <Skeleton className="hidden h-4 w-24 sm:block" aria-hidden />
          <Skeleton className="size-8 shrink-0 rounded-full" aria-hidden />
        </div>
      </div>
    </header>
  )
}
