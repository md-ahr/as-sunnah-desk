import { Skeleton } from '@/components/ui/skeleton'

export function PortalHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-tight">As-Sunnah Desk</p>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <Skeleton className="mb-1 h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </header>
  )
}
