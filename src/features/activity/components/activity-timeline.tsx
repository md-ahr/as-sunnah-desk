import { ActivityEntry } from '@/features/activity/components/activity-entry'
import type { ActivityEntryDto } from '@/features/activity/types'
import { getRequestNow } from '@/features/requests/lib/request-now'
import { listRequestActivity } from '@/server/services/request.service'

type ActivityTimelineProps = {
  entries: readonly ActivityEntryDto[]
  now: number
}

export function ActivityTimeline({ entries, now }: ActivityTimelineProps) {
  return (
    <section className="border-border bg-card rounded-lg border" aria-labelledby="activity-heading">
      <div className="border-border border-b px-6 py-4">
        <h2 id="activity-heading" className="text-base font-semibold tracking-tight">
          Activity
        </h2>
      </div>
      <div className="p-6">
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-0" aria-label="Activity">
            {entries.map((entry, index) => (
              <ActivityEntry
                key={entry.id}
                entry={entry}
                now={now}
                isLast={index === entries.length - 1}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export async function RequestActivitySection({ requestId }: { requestId: string }) {
  const [entries, now] = await Promise.all([listRequestActivity(requestId), getRequestNow()])
  return <ActivityTimeline entries={entries} now={now} />
}
