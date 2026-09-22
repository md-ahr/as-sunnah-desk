'use client'

import { useSyncExternalStore } from 'react'

import { formatAbsoluteTime } from '@/features/requests/lib/labels'

type LocalTimestampProps = {
  date: Date
  className?: string
}

function subscribe() {
  return () => {}
}

export function LocalTimestamp({ date, className }: LocalTimestampProps) {
  const formatted = useSyncExternalStore(
    subscribe,
    () => formatAbsoluteTime(date),
    () => formatAbsoluteTime(date, { timeZone: 'UTC', locale: 'en-US', hour12: true }),
  )

  return (
    <time
      className={className}
      dateTime={date.toISOString()}
      title={formatted}
      suppressHydrationWarning
    >
      {formatted}
    </time>
  )
}
