import type { RequestPriority, RequestStatus } from '@/lib/search-params/request-enums'

export type RequestListItemDto = {
  readonly id: string
  readonly reference: string
  readonly subject: string
  readonly priority: RequestPriority
  readonly status: RequestStatus
  readonly updatedAt: Date
  readonly requester: {
    readonly id: string
    readonly name: string
    readonly email: string
  }
  readonly category: {
    readonly id: string
    readonly name: string
    readonly slug: string
  }
  readonly assignee: {
    readonly id: string
    readonly name: string
  } | null
}

export type FacetCountsDto = {
  readonly status: Readonly<Partial<Record<RequestStatus, number>>>
  readonly priority: Readonly<Partial<Record<RequestPriority, number>>>
  readonly category: Readonly<Record<string, number>>
  readonly assignee: Readonly<Record<string, number>>
  readonly total: number | `${number}+`
}

export type CategoryOption = {
  readonly id: string
  readonly name: string
  readonly slug: string
}

export type AssigneeOption = {
  readonly id: string
  readonly name: string
}
