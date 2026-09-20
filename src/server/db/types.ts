import 'server-only'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type {
  categories,
  requestActivities,
  serviceRequests,
  users,
} from '@/server/db/schema'

export type UserRow = InferSelectModel<typeof users>
export type UserInsert = InferInsertModel<typeof users>

export type CategoryRow = InferSelectModel<typeof categories>
export type CategoryInsert = InferInsertModel<typeof categories>

export type ServiceRequestRow = InferSelectModel<typeof serviceRequests>
export type ServiceRequestInsert = InferInsertModel<typeof serviceRequests>

export type RequestActivityRow = InferSelectModel<typeof requestActivities>
export type RequestActivityInsert = InferInsertModel<typeof requestActivities>
