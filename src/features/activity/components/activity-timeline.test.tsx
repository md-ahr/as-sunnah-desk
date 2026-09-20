import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it } from 'vitest'

import { ActivityTimeline } from '@/features/activity/components/activity-timeline'
import type { ActivityEntryDto } from '@/features/activity/types'

const entries: ActivityEntryDto[] = [
  {
    id: 'act_1',
    requestId: 'req_1',
    type: 'created',
    field: null,
    fromValue: null,
    toValue: null,
    comment: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    actor: {
      id: 'user_viewer',
      name: 'Viewer User',
      email: 'viewer@assunnah.test',
    },
  },
  {
    id: 'act_2',
    requestId: 'req_1',
    type: 'status_changed',
    field: 'status',
    fromValue: 'new',
    toValue: 'in_progress',
    comment: null,
    createdAt: new Date('2026-01-01T11:00:00.000Z'),
    actor: {
      id: 'user_agent',
      name: 'Agent User',
      email: 'agent@assunnah.test',
    },
  },
]

describe('ActivityTimeline', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders chronological entries with timestamps', () => {
    render(<ActivityTimeline entries={entries} />)

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    expect(screen.getByText(/created this request/)).toBeInTheDocument()
    expect(screen.getByText(/changed status from New to In progress/)).toBeInTheDocument()

    const times = screen.getAllByRole('time')
    expect(times[0]).toHaveAttribute('datetime', '2026-01-01T10:00:00.000Z')
    expect(times[1]).toHaveAttribute('datetime', '2026-01-01T11:00:00.000Z')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ActivityTimeline entries={entries} />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
