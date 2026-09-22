import { faker } from '@faker-js/faker'

import { users } from '@/server/db/schema'
import type { UserInsert } from '@/server/db/types'
import type { TestDb } from '@/test/db'

export type UserOverrides = Partial<UserInsert>

function buildUser(overrides: UserOverrides = {}): UserInsert {
  return {
    id: overrides.id ?? `user_${faker.string.alphanumeric(8)}`,
    email: overrides.email ?? faker.internet.email().toLowerCase(),
    passwordHash: overrides.passwordHash ?? 'hashed-password',
    name: overrides.name ?? faker.person.fullName(),
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  }
}

export async function insertUser(db: TestDb, overrides: UserOverrides = {}): Promise<UserInsert> {
  const row = buildUser(overrides)
  await db.insert(users).values(row)
  return row
}
