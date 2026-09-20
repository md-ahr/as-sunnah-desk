import type { AppError } from '@/lib/app-error'
import { statusLabel } from '@/features/requests/lib/labels'
import type { RequestStatus } from '@/lib/search-params/request-enums'

export function messageFor(error: AppError): string {
  switch (error.code) {
    case 'VALIDATION':
      return 'Please check the update and try again.'
    case 'UNAUTHORIZED':
      return 'You must be signed in to update requests.'
    case 'FORBIDDEN':
      return error.message
    case 'NOT_FOUND':
      return 'This request could not be found.'
    case 'INVALID_TRANSITION': {
      const from = error.details?.from
      const to = error.details?.to
      if (typeof from === 'string' && typeof to === 'string') {
        return `Cannot change status from ${statusLabel(from as RequestStatus)} to ${statusLabel(to as RequestStatus)}.`
      }
      return 'That status change is not allowed.'
    }
    case 'CONFLICT': {
      const currentStatus = error.details?.currentStatus
      if (typeof currentStatus === 'string') {
        return `This request was changed by someone else. It is now ${statusLabel(currentStatus as RequestStatus)}.`
      }

      return 'This request was changed by someone else.'
    }
    case 'RATE_LIMITED':
      return 'Too many updates. Please wait and try again.'
    default:
      return error.message || 'Something went wrong.'
  }
}

export function successMessageForStatus(status: RequestStatus): string {
  return `Status changed to ${statusLabel(status)}`
}

export function successMessageForAssignee(assigneeName: string | null): string {
  return assigneeName ? `Assigned to ${assigneeName}` : 'Request unassigned'
}
