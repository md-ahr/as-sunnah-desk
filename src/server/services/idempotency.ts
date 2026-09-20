import 'server-only'

import type { Result } from '@/lib/result'
import { findByIdempotencyKey } from '@/server/repositories/activity.repository'

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('unique constraint') || message.includes('unique')
}

export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<Result<T>>,
  replay: () => Promise<Result<T> | null>,
): Promise<Result<T>> {
  const existing = await findByIdempotencyKey(key)
  if (existing) {
    const replayed = await replay()
    if (replayed) {
      return replayed
    }
  }

  try {
    return await operation()
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    const replayed = await replay()
    if (!replayed) {
      throw error
    }

    return replayed
  }
}