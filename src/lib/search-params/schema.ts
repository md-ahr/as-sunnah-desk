import { z } from 'zod'

import { DEFAULT_SORT, isSortKey } from '@/lib/search-params/cursor'
import { CATEGORY_SLUGS, isCategorySlug } from '@/lib/search-params/categories'
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '@/lib/search-params/request-enums'

export const searchParamsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.array(z.enum(REQUEST_STATUSES)).default([]),
  priority: z.array(z.enum(REQUEST_PRIORITIES)).default([]),
  category: z.array(z.enum(CATEGORY_SLUGS)).default([]),
  assignee: z.array(z.union([z.string().min(1), z.literal('unassigned')])).default([]),
  sort: z.enum(['updated_desc', 'updated_asc', 'created_desc', 'priority_desc']).default(DEFAULT_SORT),
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).max(20).catch(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .pipe(z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]))
    .catch(10)
    .default(10),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

type RawSearchParams = Record<string, string | string[] | undefined>

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function normaliseStatus(values: string[]): SearchParams['status'] {
  return values.filter((value): value is SearchParams['status'][number] =>
    (REQUEST_STATUSES as readonly string[]).includes(value),
  )
}

function normalisePriority(values: string[]): SearchParams['priority'] {
  return values.filter((value): value is SearchParams['priority'][number] =>
    (REQUEST_PRIORITIES as readonly string[]).includes(value),
  )
}

function normaliseCategory(values: string[]): SearchParams['category'] {
  return values.filter(isCategorySlug)
}

function normaliseAssignee(values: string[]): SearchParams['assignee'] {
  return values.filter((value) => value === 'unassigned' || value.length > 0)
}

function fromURLSearchParams(params: URLSearchParams): RawSearchParams {
  const raw: RawSearchParams = {}

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    raw[key] = values.length > 1 ? values : values[0]
  }

  return raw
}

function normaliseSearchParams(input: URLSearchParams | RawSearchParams): RawSearchParams {
  const raw: RawSearchParams = input instanceof URLSearchParams ? fromURLSearchParams(input) : input

  const status = normaliseStatus(toArray(raw.status))
  const priority = normalisePriority(toArray(raw.priority))
  const category = normaliseCategory(toArray(raw.category))
  const assignee = normaliseAssignee(toArray(raw.assignee))

  const sortValue = typeof raw.sort === 'string' && isSortKey(raw.sort) ? raw.sort : DEFAULT_SORT

  return {
    ...raw,
    status: status.length > 0 ? status : undefined,
    priority: priority.length > 0 ? priority : undefined,
    category: category.length > 0 ? category : undefined,
    assignee: assignee.length > 0 ? assignee : undefined,
    sort: sortValue,
  }
}

/** Never throws. Malformed URLs fall back to defaults. */
export function parseSearchParams(input: URLSearchParams | RawSearchParams): SearchParams {
  const result = searchParamsSchema.safeParse(normaliseSearchParams(input))
  return result.success ? result.data : searchParamsSchema.parse({})
}

export function hasActiveFilters(params: SearchParams): boolean {
  return Boolean(
    params.q ||
      params.status.length > 0 ||
      params.priority.length > 0 ||
      params.category.length > 0 ||
      params.assignee.length > 0,
  )
}

export function serialiseSearchParams(params: Partial<SearchParams>): string {
  const search = new URLSearchParams()

  if (params.q) {
    search.set('q', params.q)
  }

  for (const status of params.status ?? []) {
    search.append('status', status)
  }

  for (const priority of params.priority ?? []) {
    search.append('priority', priority)
  }

  for (const category of params.category ?? []) {
    search.append('category', category)
  }

  for (const assignee of params.assignee ?? []) {
    search.append('assignee', assignee)
  }

  if (params.sort && params.sort !== DEFAULT_SORT) {
    search.set('sort', params.sort)
  }

  if (params.cursor) {
    search.set('cursor', params.cursor)
  }

  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }

  if (params.perPage && params.perPage !== 10) {
    search.set('perPage', String(params.perPage))
  }

  return search.toString()
}

export function withSearchParams(
  current: SearchParams,
  patch: Partial<SearchParams>,
): SearchParams {
  const next = { ...current, ...patch }

  if (
    patch.q !== undefined ||
    patch.status !== undefined ||
    patch.priority !== undefined ||
    patch.category !== undefined ||
    patch.assignee !== undefined ||
    patch.sort !== undefined ||
    patch.perPage !== undefined
  ) {
    return { ...next, cursor: undefined, page: 1 }
  }

  return next
}
