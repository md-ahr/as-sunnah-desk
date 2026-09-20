import { describe, expect, it } from 'vitest'

import {
  parseUpdateAssigneeInput,
  parseUpdateStatusInput,
  updateAssigneeSchema,
  updateStatusSchema,
} from '@/features/requests/schemas/update'

describe('update schemas', () => {
  it('accepts valid status updates', () => {
    expect(
      updateStatusSchema.safeParse({
        id: 'req_1',
        status: 'in_review',
        version: 1,
        idempotencyKey: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true)
  })

  it('accepts valid assignee updates', () => {
    expect(
      updateAssigneeSchema.safeParse({
        id: 'req_1',
        assigneeId: 'user_admin',
        version: 2,
        idempotencyKey: '22222222-2222-4222-8222-222222222222',
      }).success,
    ).toBe(true)
  })

  it('returns field errors for invalid payloads', () => {
    const status = parseUpdateStatusInput({ id: '', status: 'invalid', version: -1, idempotencyKey: 'x' })
    const assignee = parseUpdateAssigneeInput({ id: '', assigneeId: 'x', version: -1, idempotencyKey: 'x' })

    expect(status.ok).toBe(false)
    expect(assignee.ok).toBe(false)
  })
})
