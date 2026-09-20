import { faker } from '@faker-js/faker'
import { v7 as uuidv7 } from 'uuid'

import { categories, serviceRequests } from '@/server/db/schema'
import type { ServiceRequestInsert } from '@/server/db/types'
import type { TestDb } from '@/test/db'

export type RequestInsert = ServiceRequestInsert
export type RequestOverrides = Partial<RequestInsert>

function buildRequest(overrides: RequestOverrides = {}): RequestInsert {
  const sequence = faker.number.int({ min: 1, max: 999_999 })
  const createdAt = overrides.createdAt ?? new Date('2026-01-15T10:00:00.000Z')

  return {
    id: overrides.id ?? uuidv7({ msecs: createdAt.getTime() }),
    reference: overrides.reference ?? `SR-2026-${String(sequence).padStart(6, '0')}`,
    subject: overrides.subject ?? faker.lorem.sentence(),
    description: overrides.description ?? faker.lorem.paragraph(),
    categoryId: overrides.categoryId ?? 'cat_general',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'new',
    requesterId: overrides.requesterId ?? 'user_viewer',
    assigneeId: overrides.assigneeId ?? null,
    version: overrides.version ?? 1,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    resolvedAt: overrides.resolvedAt ?? null,
    ...overrides,
  }
}

export async function insertRequest(
  db: TestDb,
  overrides: RequestOverrides = {},
): Promise<RequestInsert> {
  const row = buildRequest(overrides)
  await db.insert(serviceRequests).values(row)
  return row
}

export async function insertRequests(
  db: TestDb,
  count: number,
  overrides: RequestOverrides = {},
): Promise<void> {
  const batchSize = 500
  const rows: RequestInsert[] = []

  for (let index = 0; index < count; index += 1) {
    const createdAt = new Date(Date.UTC(2026, 0, 1) + index * 60_000)
    rows.push(
      buildRequest({
        ...overrides,
        reference: `SR-2026-${String(index + 1).padStart(6, '0')}`,
        createdAt,
        updatedAt: createdAt,
      }),
    )

    if (rows.length >= batchSize) {
      await db.insert(serviceRequests).values(rows)
      rows.length = 0
    }
  }

  if (rows.length > 0) {
    await db.insert(serviceRequests).values(rows)
  }
}

export async function insertSeedCategories(db: TestDb): Promise<void> {
  await db.insert(categories).values([
    { id: 'cat_it_support', name: 'IT Support', slug: 'it-support', isActive: true, sortOrder: 1 },
    { id: 'cat_general', name: 'General Enquiries', slug: 'general', isActive: true, sortOrder: 2 },
  ])
}
