import 'server-only'

import { and, eq } from 'drizzle-orm'

import type { Db } from '@/server/db/client'
import { getDb } from '@/server/db/client'
import { users } from '@/server/db/schema'

export type UserAuthDto = {
  readonly id: string
  readonly email: string
  readonly passwordHash: string
  readonly name: string
  readonly isActive: boolean
}

export type UserPublicDto = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly isActive: boolean
}

export type ActiveUserDto = {
  readonly id: string
  readonly email: string
  readonly name: string
}

export async function findUserById(id: string, db: Db = getDb()): Promise<UserAuthDto | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      name: users.name,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return row ?? null
}

export async function findUserByEmail(
  email: string,
  db: Db = getDb(),
): Promise<UserAuthDto | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      name: users.name,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return row ?? null
}

export async function findActiveUserById(
  id: string,
  db: Db = getDb(),
): Promise<ActiveUserDto | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.isActive, true)))
    .limit(1)

  return row ?? null
}

export async function findPublicUserById(
  id: string,
  db: Db = getDb(),
): Promise<UserPublicDto | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return row ?? null
}
