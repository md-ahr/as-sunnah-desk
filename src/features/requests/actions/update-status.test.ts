import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateStatus } from '@/features/requests/actions/update-status'
import { appError } from '@/lib/app-error'
import { err, ok } from '@/lib/result'

const { mockRequireUser, mockUpdateStatusService, mockUpdateTag, mockRevalidateTag } = vi.hoisted(
  () => ({
    mockRequireUser: vi.fn(),
    mockUpdateStatusService: vi.fn(),
    mockUpdateTag: vi.fn(),
    mockRevalidateTag: vi.fn(),
  }),
)

vi.mock('next/cache', () => ({
  updateTag: mockUpdateTag,
  revalidateTag: mockRevalidateTag,
}))

vi.mock('@/server/services/session.service', () => ({
  requireUser: mockRequireUser,
}))

vi.mock('@/server/services/request.service', () => ({
  updateStatus: mockUpdateStatusService,
}))

const validInput = {
  id: 'req_update',
  status: 'in_review',
  version: 1,
  idempotencyKey: '11111111-1111-4111-8111-111111111111',
}

const serviceResult = {
  id: 'req_update',
  reference: 'SR-2026-000900',
  status: 'in_review' as const,
  version: 2,
  assignee: { id: 'user_agent', name: 'Agent User' },
  resolvedAt: null,
  updatedAt: new Date('2026-01-15T10:00:00.000Z'),
}

describe('updateStatus action', () => {
  beforeEach(() => {
    mockRequireUser.mockReset()
    mockUpdateStatusService.mockReset()
    mockUpdateTag.mockReset()
    mockRevalidateTag.mockReset()
  })

  it('returns validation errors for malformed input', async () => {
    const result = await updateStatus({ ...validInput, status: 'not-a-status' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION')
    }
    expect(mockRequireUser).not.toHaveBeenCalled()
  })

  it('returns unauthorized when the session is missing', async () => {
    mockRequireUser.mockResolvedValue(err(appError('UNAUTHORIZED', 'Sign in required.')))

    const result = await updateStatus(validInput)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
    expect(mockUpdateStatusService).not.toHaveBeenCalled()
  })

  it('returns service errors without invalidating cache tags', async () => {
    mockRequireUser.mockResolvedValue(
      ok({ id: 'user_admin', email: 'admin@assunnah.test', name: 'Admin User' }),
    )
    mockUpdateStatusService.mockResolvedValue(
      err(appError('CONFLICT', 'This request was changed by someone else.')),
    )

    const result = await updateStatus(validInput)

    expect(result.ok).toBe(false)
    expect(mockUpdateTag).not.toHaveBeenCalled()
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('invalidates cache tags and returns a dto on success', async () => {
    mockRequireUser.mockResolvedValue(
      ok({ id: 'user_admin', email: 'admin@assunnah.test', name: 'Admin User' }),
    )
    mockUpdateStatusService.mockResolvedValue(ok(serviceResult))

    const result = await updateStatus(validInput)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toMatchObject({
        id: 'req_update',
        reference: 'SR-2026-000900',
        status: 'in_review',
        version: 2,
        resolvedAt: null,
        updatedAt: serviceResult.updatedAt.toISOString(),
      })
    }
    expect(mockUpdateTag).toHaveBeenCalledWith('request:req_update')
    expect(mockUpdateTag).toHaveBeenCalledWith('request-activity:req_update')
    expect(mockUpdateTag).toHaveBeenCalledWith('assignee-summary')
    expect(mockRevalidateTag).toHaveBeenCalledWith('facet-counts', 'max')
  })
})
