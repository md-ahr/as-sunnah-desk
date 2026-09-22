import { hash } from '@node-rs/argon2'
import { faker } from '@faker-js/faker'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'

import { v7 as uuidv7 } from 'uuid'
import type { AppDb } from '@/server/db/client'
import '@/server/db/load-env'
import { env } from '@/server/env'
import * as schema from '@/server/db/schema'
import { categories, requestActivities, serviceRequests, users } from '@/server/db/schema'
import type { ActivityType, RequestPriority, RequestStatus } from '@/server/db/schema'
import type { UserInsert } from '@/server/db/types'

const REQUEST_COUNT = 12_000
const BATCH_SIZE = 500
const FAKER_SEED = 42_026

const FIXED_CATEGORIES = [
  { id: 'cat_it_support', name: 'IT Support', slug: 'it-support', sortOrder: 1 },
  { id: 'cat_facilities', name: 'Facilities', slug: 'facilities', sortOrder: 2 },
  { id: 'cat_hr', name: 'Human Resources', slug: 'hr', sortOrder: 3 },
  { id: 'cat_finance', name: 'Finance & Payroll', slug: 'finance', sortOrder: 4 },
  { id: 'cat_procurement', name: 'Procurement', slug: 'procurement', sortOrder: 5 },
  { id: 'cat_events', name: 'Events & Programs', slug: 'events', sortOrder: 6 },
  { id: 'cat_communications', name: 'Communications', slug: 'communications', sortOrder: 7 },
  { id: 'cat_maintenance', name: 'Building Maintenance', slug: 'maintenance', sortOrder: 8 },
  { id: 'cat_security', name: 'Security & Access', slug: 'security', sortOrder: 9 },
  { id: 'cat_transport', name: 'Transport & Logistics', slug: 'transport', sortOrder: 10 },
  { id: 'cat_legal', name: 'Legal & Compliance', slug: 'legal', sortOrder: 11 },
  { id: 'cat_general', name: 'General Enquiries', slug: 'general', sortOrder: 12 },
] as const

const FIXED_USERS: ReadonlyArray<{
  id: string
  email: string
  password: string
  name: string
}> = [
  {
    id: 'user_admin',
    email: 'admin@assunnah.test',
    password: 'test.admin',
    name: 'Admin User',
  },
  {
    id: 'user_manager',
    email: 'manager@assunnah.test',
    password: 'test.manager',
    name: 'Manager User',
  },
  {
    id: 'user_agent',
    email: 'agent@assunnah.test',
    password: 'test.agent',
    name: 'Agent User',
  },
  {
    id: 'user_viewer',
    email: 'viewer@assunnah.test',
    password: 'test.viewer',
    name: 'Viewer User',
  },
]

const STATUS_WEIGHTS: ReadonlyArray<{ value: RequestStatus; weight: number }> = [
  { value: 'new', weight: 28 },
  { value: 'in_review', weight: 12 },
  { value: 'in_progress', weight: 24 },
  { value: 'on_hold', weight: 8 },
  { value: 'resolved', weight: 10 },
  { value: 'rejected', weight: 6 },
  { value: 'closed', weight: 12 },
]

const PRIORITY_WEIGHTS: ReadonlyArray<{ value: RequestPriority; weight: number }> = [
  { value: 'low', weight: 15 },
  { value: 'medium', weight: 45 },
  { value: 'high', weight: 28 },
  { value: 'urgent', weight: 12 },
]

function weightedPick<T extends string>(options: ReadonlyArray<{ value: T; weight: number }>): T {
  const total = options.reduce((sum, option) => sum + option.weight, 0)
  let roll = faker.number.int({ min: 1, max: total })
  const fallback = options[0]

  if (!fallback) {
    throw new Error('weightedPick requires at least one option')
  }

  for (const option of options) {
    roll -= option.weight
    if (roll <= 0) {
      return option.value
    }
  }

  return fallback.value
}

function logNormalMs(medianHours: number, sigma = 0.6): number {
  const u1 = faker.number.float({ min: 0.0001, max: 1 })
  const u2 = faker.number.float({ min: 0.0001, max: 1 })
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const medianMs = medianHours * 3_600_000
  const meanLog = Math.log(medianMs) - (sigma * sigma) / 2

  return Math.max(3_600_000, Math.round(Math.exp(meanLog + sigma * z)))
}

function weekdayBiasedDate(start: Date, end: Date): Date {
  const date = faker.date.between({ from: start, to: end })
  const day = date.getDay()
  if (day === 0 || day === 6) {
    date.setDate(date.getDate() + (day === 0 ? 1 : -1))
  }
  return date
}

function formatReference(sequence: number): string {
  return `SR-2026-${String(sequence).padStart(6, '0')}`
}

async function hashPassword(plain: string): Promise<string> {
  return hash(plain, {
    memoryCost: 19_456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
}

async function clearTables(db: Pick<AppDb, 'delete'>): Promise<void> {
  await db.delete(requestActivities)
  await db.delete(serviceRequests)
  await db.delete(categories)
  await db.delete(users)
}

async function seedReferenceData(db: Pick<AppDb, 'insert'>): Promise<string[]> {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const assignableUserIds: string[] = []
  const fixedRows: UserInsert[] = []
  const generatedRows: UserInsert[] = []

  for (const user of FIXED_USERS) {
    fixedRows.push({
      id: user.id,
      email: user.email,
      passwordHash: await hashPassword(user.password),
      name: user.name,
      isActive: true,
      createdAt: now,
    })

    assignableUserIds.push(user.id)
  }

  const generatedPasswordHash = await hashPassword('generated.password')

  for (let index = 0; index < 56; index += 1) {
    const id = `user_gen_${String(index + 1).padStart(2, '0')}`

    generatedRows.push({
      id,
      email: faker.internet.email().toLowerCase(),
      passwordHash: generatedPasswordHash,
      name: faker.person.fullName(),
      isActive: true,
      createdAt: now,
    })

    assignableUserIds.push(id)
  }

  await db.insert(users).values([...fixedRows, ...generatedRows])

  await db.insert(categories).values(
    FIXED_CATEGORIES.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      isActive: true,
      sortOrder: category.sortOrder,
    })),
  )

  return assignableUserIds
}

type GeneratedRequest = {
  id: string
  reference: string
  subject: string
  description: string
  categoryId: string
  priority: RequestPriority
  status: RequestStatus
  requesterId: string
  assigneeId: string | null
  version: number
  createdAt: Date
  updatedAt: Date
  resolvedAt: Date | null
}

const MUTATION_FIXTURES: Partial<
  Record<
    number,
    {
      subject: string
      status: RequestStatus
      assigneeId: string | null
    }
  >
> = {
  900: { subject: 'Mutation fixture: status update', status: 'new', assigneeId: 'user_agent' },
  901: { subject: 'Mutation fixture: assignee update', status: 'new', assigneeId: null },
  902: { subject: 'Mutation fixture: failure rollback', status: 'new', assigneeId: 'user_agent' },
  903: { subject: 'Mutation fixture: conflict recovery', status: 'new', assigneeId: 'user_agent' },
  904: { subject: 'Mutation fixture: duplicate submit', status: 'new', assigneeId: 'user_agent' },
  905: { subject: 'Mutation fixture: consecutive status', status: 'new', assigneeId: 'user_agent' },
  906: { subject: 'Mutation fixture: dashboard status', status: 'new', assigneeId: 'user_agent' },
  907: { subject: 'Mutation fixture: assignee keyboard', status: 'new', assigneeId: null },
  908: {
    subject: 'Mutation fixture: a11y keyboard journey',
    status: 'new',
    assigneeId: 'user_agent',
  },
}

function buildRequests(
  assignableUserIds: readonly string[],
  requesterIds: readonly string[],
): GeneratedRequest[] {
  const start = new Date('2024-09-01T00:00:00.000Z')
  const end = new Date('2026-03-01T00:00:00.000Z')
  const requests: GeneratedRequest[] = []

  for (let sequence = 1; sequence <= REQUEST_COUNT; sequence += 1) {
    const createdAt = weekdayBiasedDate(start, end)
    const fixture = MUTATION_FIXTURES[sequence]
    const status = fixture?.status ?? weightedPick(STATUS_WEIGHTS)
    const priority = weightedPick(PRIORITY_WEIGHTS)
    const category = faker.helpers.arrayElement(FIXED_CATEGORIES)
    const requesterId = faker.helpers.arrayElement(requesterIds)
    const assigneeId =
      fixture?.assigneeId ??
      (faker.number.float() < 0.15 ? null : faker.helpers.arrayElement([...assignableUserIds]))

    const updatedAt = new Date(
      createdAt.getTime() + faker.number.int({ min: 1, max: 21 }) * 86_400_000,
    )
    const resolvedAt =
      status === 'resolved' || status === 'closed'
        ? new Date(updatedAt.getTime() + logNormalMs(24))
        : null

    const reference = formatReference(sequence)
    const subject =
      fixture?.subject ??
      (sequence === 142
        ? 'Laptop replacement for new staff member'
        : faker.helpers.arrayElement([
            'Unable to access shared drive',
            'Requesting annual leave approval',
            'Air conditioning fault in meeting room',
            'New monitor for remote work setup',
            'Payroll discrepancy for February',
            'Visitor badge not working',
            'Software license renewal',
            faker.lorem.sentence({ min: 4, max: 8 }),
          ]))

    requests.push({
      id: uuidv7({ msecs: createdAt.getTime() }),
      reference,
      subject,
      description: faker.lorem.paragraphs({ min: 1, max: 2 }),
      categoryId: category.id,
      priority,
      status,
      requesterId,
      assigneeId,
      version: 1,
      createdAt,
      updatedAt,
      resolvedAt,
    })
  }

  return requests
}

function buildActivities(request: GeneratedRequest): Array<typeof requestActivities.$inferInsert> {
  const activityCount = faker.number.int({ min: 2, max: 8 })
  const rows: Array<typeof requestActivities.$inferInsert> = []
  let currentStatus: RequestStatus = 'new'
  let currentAssignee = request.assigneeId
  let timestamp = request.createdAt.getTime()

  rows.push({
    id: uuidv7({ msecs: timestamp }),
    requestId: request.id,
    actorId: request.requesterId,
    type: 'created',
    field: null,
    fromValue: null,
    toValue: null,
    comment: null,
    idempotencyKey: null,
    createdAt: new Date(timestamp),
  })

  for (let index = 1; index < activityCount; index += 1) {
    timestamp += faker.number.int({ min: 30, max: 720 }) * 60_000
    const type = faker.helpers.arrayElement([
      'status_changed',
      'assigned',
      'unassigned',
      'commented',
    ] as const satisfies readonly ActivityType[])

    if (type === 'status_changed') {
      const nextStatus = weightedPick(STATUS_WEIGHTS)
      rows.push({
        id: uuidv7({ msecs: timestamp }),
        requestId: request.id,
        actorId: request.assigneeId ?? request.requesterId,
        type,
        field: 'status',
        fromValue: currentStatus,
        toValue: nextStatus,
        comment: null,
        idempotencyKey: null,
        createdAt: new Date(timestamp),
      })
      currentStatus = nextStatus
      continue
    }

    if (type === 'assigned') {
      const nextAssignee = request.assigneeId ?? 'user_agent'
      rows.push({
        id: uuidv7({ msecs: timestamp }),
        requestId: request.id,
        actorId: 'user_manager',
        type,
        field: 'assignee',
        fromValue: currentAssignee,
        toValue: nextAssignee,
        comment: null,
        idempotencyKey: null,
        createdAt: new Date(timestamp),
      })
      currentAssignee = nextAssignee
      continue
    }

    if (type === 'unassigned') {
      rows.push({
        id: uuidv7({ msecs: timestamp }),
        requestId: request.id,
        actorId: 'user_manager',
        type,
        field: 'assignee',
        fromValue: currentAssignee,
        toValue: null,
        comment: null,
        idempotencyKey: null,
        createdAt: new Date(timestamp),
      })
      currentAssignee = null
      continue
    }

    rows.push({
      id: uuidv7({ msecs: timestamp }),
      requestId: request.id,
      actorId: request.requesterId,
      type: 'commented',
      field: null,
      fromValue: null,
      toValue: null,
      comment: faker.lorem.sentence(),
      idempotencyKey: null,
      createdAt: new Date(timestamp),
    })
  }

  return rows
}

async function insertBatched(
  db: Pick<AppDb, 'insert'>,
  table: typeof serviceRequests | typeof requestActivities,
  rows: Array<typeof serviceRequests.$inferInsert | typeof requestActivities.$inferInsert>,
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    await db.insert(table).values(rows.slice(offset, offset + BATCH_SIZE))
  }
}

async function rebuildFtsIndex(db: Pick<AppDb, 'run'>): Promise<void> {
  // Bulk seed path: rebuild from the content table after batch inserts (see docs/04 § seeding).
  await db.run(sql`INSERT INTO requests_fts(requests_fts) VALUES ('delete-all')`)
  await db.run(sql`INSERT INTO requests_fts(requests_fts) VALUES ('rebuild')`)
}

export async function seedDatabase(db: AppDb): Promise<void> {
  faker.seed(FAKER_SEED)

  const startedAt = Date.now()

  await db.transaction(async (tx) => {
    await clearTables(tx)
    const assignableUserIds = await seedReferenceData(tx)
    const requesterIds = [...FIXED_USERS.map((user) => user.id), ...assignableUserIds]
    const generatedRequests = buildRequests(assignableUserIds, requesterIds)

    await insertBatched(tx, serviceRequests, generatedRequests)

    const activities = generatedRequests.flatMap((request) => buildActivities(request))
    await insertBatched(tx, requestActivities, activities)
  })

  await rebuildFtsIndex(db)

  const elapsedMs = Date.now() - startedAt
  const activityCountRow = await db.select({ count: sql<number>`count(*)` }).from(requestActivities)
  const activityCount = activityCountRow[0]?.count ?? 0
  console.warn(
    `Seeded ${REQUEST_COUNT.toLocaleString()} service requests and ${activityCount.toLocaleString()} activities in ${(elapsedMs / 1000).toFixed(1)}s`,
  )
}

async function main(): Promise<void> {
  const client = createClient({ url: env.DATABASE_URL })
  const db = drizzle(client, { schema })

  try {
    await seedDatabase(db)
  } finally {
    client.close()
  }
}

if (process.argv[1]?.includes('seed.ts')) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
