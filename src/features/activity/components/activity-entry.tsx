import { formatActivityMessage } from '@/features/activity/lib/format-activity'
import { formatAbsoluteTime, formatRelativeTime } from '@/features/requests/lib/labels'
import type { ActivityEntryDto } from '@/features/activity/types'

type ActivityEntryProps = {
  entry: ActivityEntryDto
  now: number
}

export function ActivityEntry({ entry, now }: ActivityEntryProps) {
  const absolute = formatAbsoluteTime(entry.createdAt)

  return (
    <li className="relative pl-6" data-testid="activity-entry">
      <span aria-hidden="true" className="bg-border absolute top-1.5 left-0 size-2 rounded-full" />
      <p className="text-sm">
        <span className="font-medium">{entry.actor.name}</span>{' '}
        <span className="text-muted-foreground">{formatActivityMessage(entry)}</span>
      </p>
      <time
        className="text-muted-foreground mt-1 block text-xs"
        dateTime={entry.createdAt.toISOString()}
        title={absolute}
      >
        {formatRelativeTime(entry.createdAt, now)}
      </time>
    </li>
  )
}
