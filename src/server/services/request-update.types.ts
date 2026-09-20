import type { RequestStatus } from '@/lib/search-params/request-enums'

export type UpdateStatusInput = {
  readonly id: string
  readonly status: RequestStatus
  readonly version: number
  readonly idempotencyKey: string
}

export type UpdateAssigneeInput = {
  readonly id: string
  readonly assigneeId: string | null
  readonly version: number
  readonly idempotencyKey: string
}

export type RequestUpdateResult = {
  readonly id: string
  readonly reference: string
  readonly status: RequestStatus
  readonly version: number
  readonly assignee: { readonly id: string; readonly name: string } | null
  readonly resolvedAt: Date | null
  readonly updatedAt: Date
}
