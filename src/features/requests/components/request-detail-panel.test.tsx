import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it } from 'vitest'

import { RequestDetailPanel } from '@/features/requests/components/request-detail-panel'
import type { RequestDetailDto } from '@/features/requests/types'

const request: RequestDetailDto = {
  id: 'req_assigned',
  reference: 'SR-2026-000142',
  subject: 'Laptop replacement for new staff member',
  description: 'Need a laptop for onboarding.',
  priority: 'high',
  status: 'in_progress',
  createdAt: new Date('2026-01-10T09:00:00.000Z'),
  updatedAt: new Date('2026-01-15T10:00:00.000Z'),
  resolvedAt: null,
  version: 1,
  requester: {
    id: 'user_viewer',
    name: 'Viewer User',
    email: 'viewer@assunnah.test',
  },
  category: {
    id: 'cat_it_support',
    name: 'IT Support',
    slug: 'it-support',
  },
  assignee: {
    id: 'user_agent',
    name: 'Agent User',
  },
}

const editablePanelProps = {
  canEditStatus: true,
  canEditAssignee: true,
  assigneeOptions: [{ id: 'user_agent', name: 'Agent User' }],
} as const

const readOnlyPanelProps = {
  canEditStatus: false,
  canEditAssignee: false,
  assigneeOptions: [{ id: 'user_agent', name: 'Agent User' }],
} as const

describe('RequestDetailPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders request fields with update controls', () => {
    render(<RequestDetailPanel request={request} {...editablePanelProps} />)

    expect(screen.getByRole('heading', { level: 1, name: request.subject })).toBeInTheDocument()
    expect(screen.getByText(request.reference)).toBeInTheDocument()
    expect(screen.getByText(request.description)).toBeInTheDocument()
    expect(screen.getByText('IT Support')).toBeInTheDocument()
    expect(screen.getByTestId('status-badge')).toHaveTextContent('In progress')
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument()
    expect(screen.getByText('Viewer User')).toBeInTheDocument()
    expect(screen.getByText('viewer@assunnah.test')).toBeInTheDocument()
    expect(screen.queryByText('Resolved')).not.toBeInTheDocument()
  })

  it('shows resolved at when the request is resolved', () => {
    render(
      <RequestDetailPanel
        request={{
          ...request,
          status: 'resolved',
          resolvedAt: new Date('2026-01-20T12:00:00.000Z'),
        }}
        {...editablePanelProps}
      />,
    )

    expect(screen.getByText('Resolved at')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RequestDetailPanel request={request} {...readOnlyPanelProps} />,
    )
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
