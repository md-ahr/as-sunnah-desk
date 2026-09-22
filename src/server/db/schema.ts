import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const REQUEST_STATUSES = [
  'new',
  'in_review',
  'in_progress',
  'on_hold',
  'resolved',
  'rejected',
  'closed',
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number]

export const ACTIVITY_TYPES = [
  'created',
  'status_changed',
  'assigned',
  'unassigned',
  'commented',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('idx_users_email').on(table.email)],
)

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [uniqueIndex('idx_categories_slug').on(table.slug)],
)

export const serviceRequests = sqliteTable(
  'service_requests',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    priority: text('priority', { enum: REQUEST_PRIORITIES }).notNull(),
    status: text('status', { enum: REQUEST_STATUSES }).notNull(),
    requesterId: text('requester_id')
      .notNull()
      .references(() => users.id),
    assigneeId: text('assignee_id').references(() => users.id),
    version: integer('version').notNull().default(1),
    priorityRank: integer('priority_rank')
      .notNull()
      .generatedAlwaysAs(
        sql`CASE priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
        END`,
        { mode: 'stored' },
      ),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('idx_requests_reference').on(table.reference),
    index('idx_requests_updated').on(table.updatedAt, table.id),
    index('idx_requests_status_updated').on(table.status, table.updatedAt, table.id),
    index('idx_requests_assignee_status').on(table.assigneeId, table.status, table.updatedAt),
    index('idx_requests_priority_updated').on(table.priority, table.updatedAt, table.id),
    index('idx_requests_priority_rank_updated').on(table.priorityRank, table.updatedAt, table.id),
    index('idx_requests_category_updated').on(table.categoryId, table.updatedAt, table.id),
  ],
)

export const requestActivities = sqliteTable(
  'request_activities',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => serviceRequests.id),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id),
    type: text('type', { enum: ACTIVITY_TYPES }).notNull(),
    field: text('field'),
    fromValue: text('from_value'),
    toValue: text('to_value'),
    comment: text('comment'),
    idempotencyKey: text('idempotency_key'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_activities_request').on(table.requestId, table.createdAt),
    uniqueIndex('idx_activities_idem').on(table.idempotencyKey),
  ],
)
