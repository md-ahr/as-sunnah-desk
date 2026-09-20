import { describe, expect, it } from 'vitest'

import { REQUEST_STATUSES } from '@/server/db/schema'

import { allowedTransitions, canTransition, STATUS_TRANSITIONS } from './request-status.machine'

describe('request-status.machine', () => {
  it('defines transitions for every status', () => {
    for (const status of REQUEST_STATUSES) {
      expect(STATUS_TRANSITIONS[status]).toBeDefined()
    }
  })

  it('exhaustively validates every status pair', () => {
    for (const from of REQUEST_STATUSES) {
      for (const to of REQUEST_STATUSES) {
        const expected = STATUS_TRANSITIONS[from].includes(to)
        expect(canTransition(from, to)).toBe(expected)
      }
    }
  })

  it('returns the same options as the transition table', () => {
    for (const status of REQUEST_STATUSES) {
      expect(allowedTransitions(status)).toEqual(STATUS_TRANSITIONS[status])
    }
  })
})
