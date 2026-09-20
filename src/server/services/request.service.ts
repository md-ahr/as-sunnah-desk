import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import type { SearchParams } from '@/lib/search-params/schema'
import { ok } from '@/lib/result'
import type { Result } from '@/lib/result'
import type { AuthenticatedUser } from '@/server/auth/dal'
import { can } from '@/server/auth/permissions'
import { tags } from '@/server/cache/tags'
import { getDb } from '@/server/db/client'
import type { CategoryDto } from '@/server/repositories/reference.repository'
import type {
  FacetCounts,
  PageResult,
  RequestFilters,
  RequestListItem,
} from '@/server/repositories/request.repository'
import {
  countMatching,
  getFacetCounts,
  listOffset,
  listPaged,
} from '@/server/repositories/request.repository'

export type RequestListResult = {
  readonly page: PageResult<RequestListItem>
  readonly total: number | `${number}+`
  readonly facets: FacetCounts
}

function resolveCategoryIds(
  slugs: readonly string[],
  categories: readonly CategoryDto[],
): string[] {
  const slugToId = new Map(categories.map((category) => [category.slug, category.id]))
  return slugs
    .map((slug) => slugToId.get(slug))
    .filter((id): id is string => id !== undefined)
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

function scopeFilters(filters: RequestFilters, user: AuthenticatedUser): RequestFilters {
  if (can(user, 'request:read:all')) {
    return filters
  }

  return {
    ...filters,
    assigneeIds: [user.id],
  }
}

function scopeForFacets(user: AuthenticatedUser): RequestFilters {
  if (can(user, 'request:read:all')) {
    return {
      query: null,
      statuses: [],
      priorities: [],
      categoryIds: [],
      assigneeIds: [],
      sort: 'updated_desc',
    }
  }

  return {
    query: null,
    statuses: [],
    priorities: [],
    categoryIds: [],
    assigneeIds: [user.id],
    sort: 'updated_desc',
  }
}

export async function listRequests(
  params: SearchParams,
  user: AuthenticatedUser,
  categories: readonly CategoryDto[],
): Promise<Result<RequestListResult>> {
  const db = getDb()
  const filters = scopeFilters(toRepositoryFilters(params, categories), user)
  const facetScope = {
    ...scopeForFacets(user),
    query: filters.query,
  }

  let page: PageResult<RequestListItem>

  if (params.cursor) {
    page = await listPaged(db, filters, params.cursor, params.perPage)
  } else if (params.page > 1) {
    page = await listOffset(db, filters, (params.page - 1) * params.perPage, params.perPage)
  } else {
    page = await listPaged(db, filters, null, params.perPage)
  }

  const [total, facets] = await Promise.all([
    countMatching(db, filters),
    can(user, 'request:read:all')
      ? getCachedFacetCounts(facetScope)
      : getFacetCounts(db, facetScope),
  ])

  return ok({ page, total, facets })
}

async function getCachedFacetCounts(scope: RequestFilters): Promise<FacetCounts> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.facetCounts())

  return getFacetCounts(getDb(), scope)
}
