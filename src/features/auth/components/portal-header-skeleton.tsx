import { Skeleton } from '@/components/ui/skeleton'

export function PortalHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <Skeleton className="h-8 w-[7.25rem] shrink-0" aria-hidden />
          <div aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-border sm:block" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
        <Skeleton className="size-8 shrink-0 rounded-full" aria-hidden />
      </div>
    </header>
  )
}
