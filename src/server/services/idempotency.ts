import 'server-only'

import { ok } from '@/lib/result'
import type { Result } from '@/lib/result'
import { findByIdempotencyKey } from '@/server/repositories/activity.repository'
import { getById } from '@/server/repositories/request.repository'
import type { RequestDetail } from '@/server/repositories/request.repository'

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('unique constraint') || message.includes('unique')
}

export async function withIdempotency<T extends RequestDetail>(
  key: string,
  operation: () => Promise<Result<T>>,
): Promise<Result<T>> {
  const existing = await findByIdempotencyKey(key)
  if (existing) {
    const request = await getById(existing.requestId)
    if (!request) {
      return operation()
    }

    return ok(request as T)
  }

  try {
    return await operation()
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    const replay = await findByIdempotencyKey(key)
    if (!replay) {
      throw error
    }

    const request = await getById(replay.requestId)
    if (!request) {
      throw error
    }

    return ok(request as T)
  }
}
