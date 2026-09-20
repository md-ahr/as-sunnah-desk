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
    <section
      className="border-border bg-card rounded-lg border p-6"
      aria-labelledby="activity-heading"
    >
      <h2 id="activity-heading" className="text-lg font-medium">
        Activity
      </h2>
      {entries.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">No activity recorded yet.</p>
      ) : (
        <ol className="mt-4 space-y-4" aria-label="Activity">
          {entries.map((entry) => (
            <ActivityEntry key={entry.id} entry={entry} now={now} />
          ))}
        </ol>
      )}
    </section>
  )
}

export async function RequestActivitySection({ requestId }: { requestId: string }) {
  const [entries, now] = await Promise.all([listRequestActivity(requestId), getRequestNow()])
  return <ActivityTimeline entries={entries} now={now} />
}
