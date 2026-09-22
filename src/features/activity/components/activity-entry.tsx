import { formatActivityMessage } from '@/features/activity/lib/format-activity'
import { formatAbsoluteTime, formatRelativeTime } from '@/features/requests/lib/labels'
import type { ActivityEntryDto } from '@/features/activity/types'

type ActivityEntryProps = {
  entry: ActivityEntryDto
  now: number
  isLast?: boolean
}

export function ActivityEntry({ entry, now, isLast = false }: ActivityEntryProps) {
  const absolute = formatAbsoluteTime(entry.createdAt)
  const isComment = entry.type === 'commented' && entry.comment
  const message = isComment ? 'added a comment' : formatActivityMessage(entry)

  return (
    <li className="relative pb-6 pl-8 last:pb-0" data-testid="activity-entry">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="bg-border absolute top-3.5 left-[7px] h-[calc(100%-0.5rem)] w-px"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="border-border bg-card absolute top-1 left-0 size-3.5 rounded-full border-2"
      />
      <p className="text-sm leading-snug">
        <span className="font-medium">{entry.actor.name}</span>{' '}
        <span className="text-muted-foreground">{message}</span>
      </p>
      {isComment ? (
        <blockquote className="border-border bg-muted/50 mt-2 rounded-md border-l-2 py-2 pr-3 pl-3 text-sm leading-relaxed">
          {entry.comment}
        </blockquote>
      ) : null}
      <time
        className="text-muted-foreground mt-1.5 block text-xs tabular-nums"
        dateTime={entry.createdAt.toISOString()}
        title={absolute}
      >
        {formatRelativeTime(entry.createdAt, now)}
      </time>
    </li>
  )
}
