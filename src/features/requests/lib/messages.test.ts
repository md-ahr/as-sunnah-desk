import { describe, expect, it } from 'vitest'

import {
  messageFor,
  successMessageForAssignee,
  successMessageForStatus,
} from '@/features/requests/lib/messages'
import { appError } from '@/lib/app-error'

describe('update error messages', () => {
  it.each([
    ['VALIDATION', 'Please check the update and try again.'],
    ['UNAUTHORIZED', 'You must be signed in to update requests.'],
    ['NOT_FOUND', 'This request could not be found.'],
    ['RATE_LIMITED', 'Too many updates. Please wait and try again.'],
  ] as const)('maps %s to a friendly message', (code, expected) => {
    expect(messageFor(appError(code, 'ignored'))).toBe(expected)
  })

  it('returns forbidden messages verbatim', () => {
    expect(messageFor(appError('FORBIDDEN', 'You cannot edit this request.'))).toBe(
      'You cannot edit this request.',
    )
  })

  it('includes the current status on conflict', () => {
    const error = appError('CONFLICT', 'This request was changed by someone else.', {
      currentStatus: 'in_review',
      currentVersion: 2,
    })

    expect(messageFor(error)).toBe('This request was changed by someone else. It is now In review.')
  })

  it('falls back when conflict details are missing', () => {
    expect(messageFor(appError('CONFLICT', 'This request was changed by someone else.'))).toBe(
      'This request was changed by someone else.',
    )
  })

  it('describes invalid transitions with readable status labels', () => {
    const error = appError('INVALID_TRANSITION', 'That status change is not allowed.', {
      from: 'new',
      to: 'resolved',
    })

    expect(messageFor(error)).toBe('Cannot change status from New to Resolved.')
  })

  it('falls back when invalid transition details are missing', () => {
    expect(messageFor(appError('INVALID_TRANSITION', 'That status change is not allowed.'))).toBe(
      'That status change is not allowed.',
    )
  })

  it('uses the server message for unknown error codes', () => {
    expect(messageFor(appError('INTERNAL', 'Database unavailable'))).toBe('Database unavailable')
    expect(messageFor(appError('INTERNAL', ''))).toBe('Something went wrong.')
  })
})

describe('update success messages', () => {
  it('describes a status change', () => {
    expect(successMessageForStatus('in_review')).toBe('Status changed to In review')
  })

  it('describes assignee changes', () => {
    expect(successMessageForAssignee('Agent User')).toBe('Assigned to Agent User')
    expect(successMessageForAssignee(null)).toBe('Request unassigned')
  })
})
