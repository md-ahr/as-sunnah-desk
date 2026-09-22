import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { v7 as uuidv7 } from 'uuid'

import { OFFSET_PAGE_LIMIT } from '@/lib/pagination/constants'
import type { SearchParams } from '@/lib/search-params/schema'
import { appError } from '@/lib/app-error'
import { ok, err } from '@/lib/result'
import type { Result } from '@/lib/result'
import type { AuthenticatedUser } from '@/server/auth/dal'
import { tags } from '@/server/cache/tags'
import { getDb } from '@/server/db/client'
import type { CategoryDto } from '@/server/repositories/reference.repository'
import { listAssignableUsers } from '@/server/repositories/reference.repository'
import {
  insertActivity,
  listActivitiesByRequestId,
} from '@/server/repositories/activity.repository'
import type { ActivityListItem } from '@/server/repositories/activity.repository'
import type {
  FacetCounts,
  PageResult,
  RequestDetail,
  RequestFilters,
  RequestListItem,
} from '@/server/repositories/request.repository'
import {
  countMatching,
  getById,
  getByReference as findRequestByReference,
  getFacetCounts,
  listFromEnd,
  listOffset,
  listPaged,
  updateAssigneeIfVersionMatches,
  updateStatusIfVersionMatches,
} from '@/server/repositories/request.repository'
import { withIdempotency } from '@/server/services/idempotency'
import type {
  RequestUpdateResult,
  UpdateAssigneeInput,
  UpdateStatusInput,
} from '@/server/services/request-update.types'
import { canTransition } from '@/lib/request-status'

export type { RequestUpdateResult, UpdateAssigneeInput, UpdateStatusInput }

export type { ActivityListItem, RequestDetail }

export type RequestListResult = {
  readonly page: PageResult<RequestListItem>
  readonly total: number
  readonly facets: FacetCounts
}

function emptyRequestPage(): PageResult<RequestListItem> {
  return {
    items: [],
    nextCursor: null,
    previousCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
  }
}

function resolveCategoryIds(
  slugs: readonly string[],
  categories: readonly CategoryDto[],
): string[] {
  const slugToId = new Map(categories.map((category) => [category.slug, category.id]))
  return slugs.map((slug) => slugToId.get(slug)).filter((id): id is string => id !== undefined)
}

function toRepositoryFilters(
  params: SearchParams,
  categories: readonly CategoryDto[],
): RequestFilters {
  return {
    query: params.q ?? null,
    statuses: params.status,
    priorities: params.priority,
    categoryIds: resolveCategoryIds(params.category, categories),
    assigneeIds: params.assignee,
    sort: params.sort,
  }
}

export async function listRequests(
  params: SearchParams,
  categories: readonly CategoryDto[],
): Promise<Result<RequestListResult>> {
  const db = getDb()
  const filters = toRepositoryFilters(params, categories)
  const facetScope: RequestFilters = {
    query: filters.query,
    statuses: [],
    priorities: [],
    categoryIds: [],
    assigneeIds: [],
    sort: 'updated_desc',
  }

  if (params.seek === 'end') {
    const [total, facets] = await Promise.all([
      countMatching(db, filters),
      getCachedFacetCounts(facetScope),
    ])
    const page =
      total > 0 ? await listFromEnd(db, filters, params.perPage, total) : emptyRequestPage()

    return ok({ page, total, facets })
  }

  let page: PageResult<RequestListItem>

  if (params.cursor) {
    page = await listPaged(db, filters, params.cursor, params.perPage)
  } else if (params.page > 1 && params.page <= OFFSET_PAGE_LIMIT) {
    page = await listOffset(db, filters, (params.page - 1) * params.perPage, params.perPage)
  } else {
    page = await listPaged(db, filters, null, params.perPage)
  }

  const [total, facets] = await Promise.all([
    countMatching(db, filters),
    getCachedFacetCounts(facetScope),
  ])

  return ok({ page, total, facets })
}

async function getCachedFacetCounts(scope: RequestFilters): Promise<FacetCounts> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.facetCounts())

  return getFacetCounts(getDb(), scope)
}

export async function getByReference(reference: string): Promise<RequestDetail | null> {
  return findRequestByReference(reference)
}

export async function listRequestActivity(requestId: string): Promise<ActivityListItem[]> {
  return listActivitiesByRequestId(requestId)
}

function toUpdateResult(request: RequestDetail): RequestUpdateResult {
  return {
    id: request.id,
    reference: request.reference,
    status: request.status,
    version: request.version,
    assignee: request.assignee,
    resolvedAt: request.resolvedAt,
    updatedAt: request.updatedAt,
  }
}

function replayUpdate(requestId: string): Promise<Result<RequestUpdateResult> | null> {
  return getById(requestId).then((request) => (request ? ok(toUpdateResult(request)) : null))
}

export async function updateStatus(
  user: AuthenticatedUser,
  input: UpdateStatusInput,
): Promise<Result<RequestUpdateResult>> {
  return withIdempotency<RequestUpdateResult>(
    input.idempotencyKey,
    async () => {
      const request = await getById(input.id)
      if (!request) {
        return err(appError('NOT_FOUND', 'Request not found.'))
      }

      if (request.status === input.status) {
        return ok(toUpdateResult(request))
      }

      if (!canTransition(request.status, input.status)) {
        return err(
          appError('INVALID_TRANSITION', 'That status change is not allowed.', {
            from: request.status,
            to: input.status,
          }),
        )
      }

      const now = new Date()
      const db = getDb()

      const updated = await db.transaction(async (tx) => {
        const next = await updateStatusIfVersionMatches(
          tx,
          input.id,
          input.version,
          input.status,
          now,
        )

        if (!next) {
          return null
        }

        await insertActivity(
          {
            id: uuidv7({ msecs: now.getTime() }),
            requestId: input.id,
            actorId: user.id,
            type: 'status_changed',
            field: 'status',
            fromValue: request.status,
            toValue: input.status,
            comment: null,
            idempotencyKey: input.idempotencyKey,
            createdAt: now,
          },
          tx,
        )

        return next
      })

      if (!updated) {
        const current = await getById(input.id)
        if (!current) {
          return err(appError('NOT_FOUND', 'Request not found.'))
        }

        return err(
          appError('CONFLICT', 'This request was changed by someone else.', {
            currentStatus: current.status,
            currentVersion: current.version,
            currentAssignee: current.assignee,
          }),
        )
      }

      return ok(toUpdateResult(updated))
    },
    () => replayUpdate(input.id),
  )
}

export async function updateAssignee(
  user: AuthenticatedUser,
  input: UpdateAssigneeInput,
): Promise<Result<RequestUpdateResult>> {
  return withIdempotency<RequestUpdateResult>(
    input.idempotencyKey,
    async () => {
      const request = await getById(input.id)
      if (!request) {
        return err(appError('NOT_FOUND', 'Request not found.'))
      }

      if (input.assigneeId !== null) {
        const assignableUsers = await listAssignableUsers()
        const target = assignableUsers.find((candidate) => candidate.id === input.assigneeId)
        if (!target) {
          return err(appError('NOT_FOUND', 'Assignee not found.'))
        }
      }

      const currentAssigneeId = request.assignee?.id ?? null
      if (currentAssigneeId === input.assigneeId) {
        return ok(toUpdateResult(request))
      }

      const now = new Date()
      const db = getDb()
      const activityType = input.assigneeId === null ? 'unassigned' : 'assigned'

      const updated = await db.transaction(async (tx) => {
        const next = await updateAssigneeIfVersionMatches(
          tx,
          input.id,
          input.version,
          input.assigneeId,
          now,
        )

        if (!next) {
          return null
        }

        await insertActivity(
          {
            id: uuidv7({ msecs: now.getTime() }),
            requestId: input.id,
            actorId: user.id,
            type: activityType,
            field: 'assignee',
            fromValue: currentAssigneeId,
            toValue: input.assigneeId,
            comment: null,
            idempotencyKey: input.idempotencyKey,
            createdAt: now,
          },
          tx,
        )

        return next
      })

      if (!updated) {
        const current = await getById(input.id)
        if (!current) {
          return err(appError('NOT_FOUND', 'Request not found.'))
        }

        return err(
          appError('CONFLICT', 'This request was changed by someone else.', {
            currentStatus: current.status,
            currentVersion: current.version,
            currentAssignee: current.assignee,
          }),
        )
      }

      return ok(toUpdateResult(updated))
    },
    () => replayUpdate(input.id),
  )
}
