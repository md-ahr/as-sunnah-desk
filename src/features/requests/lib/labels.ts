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

export function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minutes = Math.round(absMs / 60_000)
  const hours = Math.round(absMs / 3_600_000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (minutes < 60) return formatter.format(Math.round(diffMs / 60_000), 'minute')
  if (hours < 48) return formatter.format(Math.round(diffMs / 3_600_000), 'hour')
  return formatter.format(Math.round(diffMs / 86_400_000), 'day')
}

export function formatAbsoluteTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
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
