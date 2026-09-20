import { statusLabel } from '@/features/requests/lib/labels'
import { REQUEST_STATUSES } from '@/lib/search-params/request-enums'
import type { RequestStatus } from '@/lib/search-params/request-enums'

export type ActivityMessageInput = {
  readonly type: 'created' | 'status_changed' | 'assigned' | 'unassigned' | 'commented'
  readonly field: string | null
  readonly fromValue: string | null
  readonly toValue: string | null
  readonly comment: string | null
}

function isStatus(value: string): value is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(value)
}

function statusText(value: string | null): string {
  if (value && isStatus(value)) {
    return statusLabel(value)
  }

  return value ?? 'unknown'
}

export function formatActivityMessage(entry: ActivityMessageInput): string {
  switch (entry.type) {
    case 'created':
      return 'created this request'
    case 'status_changed':
      return `changed status from ${statusText(entry.fromValue)} to ${statusText(entry.toValue)}`
    case 'assigned':
      return `assigned the request to ${entry.toValue ?? 'someone'}`
    case 'unassigned':
      return 'removed the assignee'
    case 'commented':
      return entry.comment ? `commented: ${entry.comment}` : 'added a comment'
  }
}
