import { ClearFiltersButton } from '@/features/requests/components/clear-filters-button'

type EmptyStateProps = {
  hasActiveFilters: boolean
}

export function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <div
        role="status"
        className="border-border rounded-lg border border-dashed px-6 py-16 text-center"
      >
        <h2 className="text-lg font-medium">No requests match these filters</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Try removing a filter or widening your search.
        </p>
        <ClearFiltersButton className="mt-4" />
      </div>
    )
  }

  return (
    <div
      role="status"
      className="border-border rounded-lg border border-dashed px-6 py-16 text-center"
    >
      <h2 className="text-lg font-medium">No service requests yet</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Requests submitted by staff and stakeholders will appear here.
      </p>
    </div>
  )
}
