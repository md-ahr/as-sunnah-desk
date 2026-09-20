export function InsightsSummarySkeleton() {
  return (
    <div
      role="status"
      className="overflow-hidden rounded-lg border border-border shadow-sm"
      aria-busy="true"
      aria-label="Loading assignee summary"
    >
      <div className="h-10 bg-muted/40" />
      <div className="space-y-0">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-12 border-t border-border bg-muted/20" />
        ))}
      </div>
    </div>
  )
}
