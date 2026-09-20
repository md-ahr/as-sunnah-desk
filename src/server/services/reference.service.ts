import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tags } from '@/server/cache/tags'
import type { AssignableUserDto, CategoryDto } from '@/server/repositories/reference.repository'
import { listAssignableUsers, listCategories } from '@/server/repositories/reference.repository'

export type FilterOptions = {
  readonly categories: readonly CategoryDto[]
  readonly assignees: readonly AssignableUserDto[]
}

export async function getFilterOptions(): Promise<FilterOptions> {
  'use cache'
  cacheLife('minutes')
  cacheTag(tags.referenceFilters())

  const [categories, assignees] = await Promise.all([listCategories(), listAssignableUsers()])

  return { categories, assignees }
}
