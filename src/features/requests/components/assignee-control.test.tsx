import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { AssigneeControl } from '@/features/requests/components/assignee-control'
import type { RequestUpdateResultDto } from '@/features/requests/types'
import type { Result } from '@/lib/result'

const updateAssignee = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

vi.mock('@/features/requests/actions/update-assignee', () => ({
  updateAssignee: (...args: unknown[]) =>
    updateAssignee(...args) as Promise<Result<RequestUpdateResultDto>>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const options = [
  { id: 'user_admin', name: 'Admin User' },
  { id: 'user_agent', name: 'Agent User' },
]

function renderControl(canEdit = true) {
  return render(
    <TooltipProvider>
      <AssigneeControl
        requestId="req_1"
        assignee={null}
        version={1}
        canEdit={canEdit}
        options={options}
      />
    </TooltipProvider>,
  )
}

describe('AssigneeControl', () => {
  afterEach(() => {
    cleanup()
    updateAssignee.mockReset()
  })

  it('exposes an assignee combobox when editing is allowed', () => {
    renderControl()

    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeEnabled()
  })

  it('renders a read-only label when canEdit is false', () => {
    renderControl(false)

    expect(screen.getByTestId('assignee-control')).toHaveTextContent('Unassigned')
    expect(screen.queryByRole('combobox', { name: 'Assignee' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderControl(false)
    const results = await axe(container)

    expect(results.violations).toEqual([])
  })
})
