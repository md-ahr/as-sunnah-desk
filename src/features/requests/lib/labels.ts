import type { RequestPriority, RequestStatus } from '@/lib/search-params/request-enums'

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  in_review: 'In review',
  in_progress: 'In progress',
  on_hold: 'On hold',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
}

const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status]
}

export function priorityLabel(priority: RequestPriority): string {
  return PRIORITY_LABELS[priority]
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const MONTH_MS = 30 * DAY_MS
const YEAR_MS = 365 * DAY_MS

export function formatRelativeTime(date: Date, now: Date | number): string {
  const nowMs = typeof now === 'number' ? now : now.getTime()
  const diffMs = date.getTime() - nowMs
  const absMs = Math.abs(diffMs)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' })

  if (absMs < HOUR_MS) return formatter.format(Math.round(diffMs / MINUTE_MS), 'minute')
  if (absMs < DAY_MS) return formatter.format(Math.round(diffMs / HOUR_MS), 'hour')
  if (absMs < MONTH_MS) return formatter.format(Math.round(diffMs / DAY_MS), 'day')

  if (absMs < YEAR_MS) {
    const months = Math.round(diffMs / MONTH_MS)
    if (Math.abs(months) < 12) {
      return formatter.format(months === 0 ? -1 : months, 'month')
    }
  }

  const years = Math.round(diffMs / YEAR_MS)
  return formatter.format(years === 0 ? -1 : years, 'year')
}

export type FormatAbsoluteTimeOptions = {
  locale?: string | string[]
  timeZone?: string
  hour12?: boolean
}

export function formatAbsoluteTime(date: Date, options?: FormatAbsoluteTimeOptions): string {
  const { locale, timeZone, hour12 } = options ?? {}

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(hour12 === undefined ? {} : { hour12 }),
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(date)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  const second = parts[1]
  if (!first) return '?'
  if (!second) return first.slice(0, 2).toUpperCase()
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase()
}
