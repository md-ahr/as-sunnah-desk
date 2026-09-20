import { REQUEST_STATUSES } from '@/lib/search-params/request-enums'
import type { RequestStatus } from '@/lib/search-params/request-enums'
import { allowedTransitions, canTransition, STATUS_TRANSITIONS } from '@/lib/request-status'
import { describe, expect, it } from 'vitest'

describe('request-status', () => {
  it('defines transitions for every status', () => {
    for (const status of REQUEST_STATUSES) {
      expect(STATUS_TRANSITIONS[status]).toBeDefined()
    }
  })

  it('exhaustively validates every status pair', () => {
    for (const from of REQUEST_STATUSES) {
      for (const to of REQUEST_STATUSES) {
        const expected = (STATUS_TRANSITIONS[from] as readonly RequestStatus[]).includes(to)
        expect(canTransition(from, to)).toBe(expected)
      }
    }
  })

  it('returns the same options as the transition table', () => {
    for (const status of REQUEST_STATUSES) {
      expect(allowedTransitions(status)).toEqual(STATUS_TRANSITIONS[status])
    }
  })

  it('treats closed as terminal', () => {
    expect(REQUEST_STATUSES.filter((to) => canTransition('closed', to))).toEqual([])
  })
})
