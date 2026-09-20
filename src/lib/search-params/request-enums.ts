export const REQUEST_STATUSES = [
  'new',
  'in_review',
  'in_progress',
  'on_hold',
  'resolved',
  'rejected',
  'closed',
] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type RequestPriority = (typeof REQUEST_PRIORITIES)[number]
