import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateAssignee } from '@/features/requests/actions/update-assignee'
import { appError } from '@/lib/app-error'
import { err, ok } from '@/lib/result'

const { mockRequireUser, mockUpdateAssigneeService, mockUpdateTag, mockRevalidateTag } = vi.hoisted(
  () => ({
    mockRequireUser: vi.fn(),
    mockUpdateAssigneeService: vi.fn(),
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
  updateAssignee: mockUpdateAssigneeService,
}))

const validInput = {
  id: 'req_assign',
  assigneeId: 'user_manager',
  version: 1,
  idempotencyKey: '66666666-6666-4666-8666-666666666666',
}

const serviceResult = {
  id: 'req_assign',
  reference: 'SR-2026-000901',
  status: 'new' as const,
  version: 2,
  assignee: { id: 'user_manager', name: 'Manager User' },
  resolvedAt: null,
  updatedAt: new Date('2026-01-15T10:00:00.000Z'),
}

describe('updateAssignee action', () => {
  beforeEach(() => {
    mockRequireUser.mockReset()
    mockUpdateAssigneeService.mockReset()
    mockUpdateTag.mockReset()
    mockRevalidateTag.mockReset()
  })

  it('returns validation errors for malformed input', async () => {
    const result = await updateAssignee({ ...validInput, idempotencyKey: 'not-a-uuid' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION')
    }
    expect(mockRequireUser).not.toHaveBeenCalled()
  })

  it('returns unauthorized when the session is missing', async () => {
    mockRequireUser.mockResolvedValue(err(appError('UNAUTHORIZED', 'Sign in required.')))

    const result = await updateAssignee(validInput)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
    expect(mockUpdateAssigneeService).not.toHaveBeenCalled()
  })

  it('returns service errors without invalidating cache tags', async () => {
    mockRequireUser.mockResolvedValue(
      ok({ id: 'user_admin', email: 'admin@assunnah.test', name: 'Admin User' }),
    )
    mockUpdateAssigneeService.mockResolvedValue(err(appError('NOT_FOUND', 'Assignee not found.')))

    const result = await updateAssignee(validInput)

    expect(result.ok).toBe(false)
    expect(mockUpdateTag).not.toHaveBeenCalled()
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('invalidates cache tags and returns a dto on success', async () => {
    mockRequireUser.mockResolvedValue(
      ok({ id: 'user_admin', email: 'admin@assunnah.test', name: 'Admin User' }),
    )
    mockUpdateAssigneeService.mockResolvedValue(ok(serviceResult))

    const result = await updateAssignee(validInput)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toMatchObject({
        id: 'req_assign',
        reference: 'SR-2026-000901',
        assignee: { id: 'user_manager', name: 'Manager User' },
        updatedAt: serviceResult.updatedAt.toISOString(),
      })
    }
    expect(mockUpdateTag).toHaveBeenCalledWith('request:req_assign')
    expect(mockUpdateTag).toHaveBeenCalledWith('request-activity:req_assign')
    expect(mockUpdateTag).toHaveBeenCalledWith('assignee-summary')
    expect(mockRevalidateTag).toHaveBeenCalledWith('facet-counts', 'max')
  })
})
