import { describe, expect, it } from 'vitest'

import { formatActivityMessage } from '@/features/activity/lib/format-activity'

describe('formatActivityMessage', () => {
  it('describes a created event', () => {
    expect(
      formatActivityMessage({
        type: 'created',
        field: null,
        fromValue: null,
        toValue: null,
        comment: null,
      }),
    ).toBe('created this request')
  })

  it('describes a status change with readable labels', () => {
    expect(
      formatActivityMessage({
        type: 'status_changed',
        field: 'status',
        fromValue: 'new',
        toValue: 'in_progress',
        comment: null,
      }),
    ).toBe('changed status from New to In progress')
  })

  it('describes assignment and unassignment', () => {
    expect(
      formatActivityMessage({
        type: 'assigned',
        field: 'assignee',
        fromValue: null,
        toValue: 'Agent User',
        comment: null,
      }),
    ).toBe('assigned the request to Agent User')

    expect(
      formatActivityMessage({
        type: 'unassigned',
        field: 'assignee',
        fromValue: 'Agent User',
        toValue: null,
        comment: null,
      }),
    ).toBe('removed the assignee')
  })

  it('uses the comment text for commented events', () => {
    expect(
      formatActivityMessage({
        type: 'commented',
        field: null,
        fromValue: null,
        toValue: null,
        comment: 'Need a follow-up on hardware.',
      }),
    ).toBe('commented: Need a follow-up on hardware.')
  })
})
