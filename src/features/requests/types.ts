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
  readonly version: number
}

export type FacetCountsDto = {
  readonly status: Readonly<Partial<Record<RequestStatus, number>>>
  readonly priority: Readonly<Partial<Record<RequestPriority, number>>>
  readonly category: Readonly<Record<string, number>>
  readonly assignee: Readonly<Record<string, number>>
  readonly total: number
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

export type RequestDetailDto = RequestListItemDto & {
  readonly description: string
  readonly createdAt: Date
  readonly resolvedAt: Date | null
}

export type RequestUpdateResultDto = {
  readonly id: string
  readonly reference: string
  readonly status: RequestStatus
  readonly version: number
  readonly assignee: AssigneeOption | null
  readonly resolvedAt: string | null
  readonly updatedAt: string
}
