import type { RequestStatus } from '@/server/db/schema'

export const STATUS_TRANSITIONS = {
  new: ['in_review', 'rejected'],
  in_review: ['in_progress', 'rejected'],
  in_progress: ['on_hold', 'resolved'],
  on_hold: ['in_progress', 'rejected'],
  resolved: ['closed', 'in_progress'],
  rejected: ['closed'],
  closed: [],
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return (STATUS_TRANSITIONS[from] as readonly RequestStatus[]).includes(to)
}

export function allowedTransitions(from: RequestStatus): readonly RequestStatus[] {
  return STATUS_TRANSITIONS[from]
}
