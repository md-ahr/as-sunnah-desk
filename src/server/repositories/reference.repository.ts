import 'server-only'

import { asc, eq } from 'drizzle-orm'

import type { Db } from '@/server/db/client'
import { getDb } from '@/server/db/client'
import { categories, users } from '@/server/db/schema'
import type { UserRole } from '@/server/db/schema'

export type CategoryDto = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly sortOrder: number
}

export type AssignableUserDto = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

export async function listCategories(db: Db = getDb()): Promise<CategoryDto[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder))

  return rows
}

export async function listAssignableUsers(db: Db = getDb()): Promise<AssignableUserDto[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name))

  return rows.filter((user) => user.role !== 'viewer')
}
