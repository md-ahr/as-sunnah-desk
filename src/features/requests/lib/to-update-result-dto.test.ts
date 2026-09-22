import { describe, expect, it } from 'vitest'

import { toUpdateResultDto } from '@/features/requests/lib/to-update-result-dto'
import type { RequestUpdateResult } from '@/server/services/request-update.types'

describe('toUpdateResultDto', () => {
  it('serialises update timestamps and nullable fields', () => {
    const updatedAt = new Date('2026-01-15T10:00:00.000Z')
    const resolvedAt = new Date('2026-01-16T12:30:00.000Z')
    const result: RequestUpdateResult = {
      id: 'req_1',
      reference: 'SR-2026-000142',
      status: 'resolved',
      version: 3,
      assignee: { id: 'user_agent', name: 'Agent User' },
      resolvedAt,
      updatedAt,
    }

    expect(toUpdateResultDto(result)).toEqual({
      id: 'req_1',
      reference: 'SR-2026-000142',
      status: 'resolved',
      version: 3,
      assignee: { id: 'user_agent', name: 'Agent User' },
      resolvedAt: resolvedAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  })

  it('maps missing assignee and resolved timestamps to null', () => {
    const updatedAt = new Date('2026-01-15T10:00:00.000Z')
    const result: RequestUpdateResult = {
      id: 'req_2',
      reference: 'SR-2026-000200',
      status: 'new',
      version: 1,
      assignee: null,
      resolvedAt: null,
      updatedAt,
    }

    expect(toUpdateResultDto(result)).toMatchObject({
      assignee: null,
      resolvedAt: null,
      updatedAt: updatedAt.toISOString(),
    })
  })
})
