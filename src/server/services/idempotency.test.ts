import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ok } from '@/lib/result'
import { findByIdempotencyKey } from '@/server/repositories/activity.repository'
import { withIdempotency } from '@/server/services/idempotency'

vi.mock('@/server/repositories/activity.repository', () => ({
  findByIdempotencyKey: vi.fn(),
}))

describe('withIdempotency', () => {
  beforeEach(() => {
    vi.mocked(findByIdempotencyKey).mockReset()
  })

  it('replays an existing key without running the operation', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue({ requestId: 'req_1' })
    const operation = vi.fn()
    const replay = vi.fn().mockResolvedValue(ok({ id: 'req_1' }))

    const result = await withIdempotency('key-1', operation, replay)

    expect(result).toEqual(ok({ id: 'req_1' }))
    expect(operation).not.toHaveBeenCalled()
    expect(replay).toHaveBeenCalledOnce()
  })

  it('runs the operation when replay is unavailable for an existing key', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue({ requestId: 'req_1' })
    const operation = vi.fn().mockResolvedValue(ok({ id: 'req_new' }))
    const replay = vi.fn().mockResolvedValue(null)

    const result = await withIdempotency('key-1b', operation, replay)

    expect(result).toEqual(ok({ id: 'req_new' }))
    expect(operation).toHaveBeenCalledOnce()
  })

  it('runs the operation when no idempotency record exists', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue(null)
    const operation = vi.fn().mockResolvedValue(ok({ id: 'req_new' }))

    const result = await withIdempotency('key-2', operation, vi.fn())

    expect(result).toEqual(ok({ id: 'req_new' }))
    expect(operation).toHaveBeenCalledOnce()
  })

  it('replays after a unique constraint failure', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue(null)
    const operation = vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed'))
    const replay = vi.fn().mockResolvedValue(ok({ id: 'req_replayed' }))

    const result = await withIdempotency('key-3', operation, replay)

    expect(result).toEqual(ok({ id: 'req_replayed' }))
    expect(replay).toHaveBeenCalledOnce()
  })

  it('rethrows non-unique errors', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue(null)
    const operation = vi.fn().mockRejectedValue(new Error('connection lost'))

    await expect(withIdempotency('key-4', operation, vi.fn())).rejects.toThrow('connection lost')
  })

  it('rethrows non-error failures', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue(null)
    const operation = vi.fn().mockRejectedValue('broken')

    await expect(withIdempotency('key-6', operation, vi.fn())).rejects.toBe('broken')
  })

  it('rethrows when replay is unavailable after a unique constraint failure', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValue(null)
    const uniqueError = new Error('unique constraint failed')
    const operation = vi.fn().mockRejectedValue(uniqueError)
    const replay = vi.fn().mockResolvedValue(null)

    await expect(withIdempotency('key-5', operation, replay)).rejects.toBe(uniqueError)
  })
})
