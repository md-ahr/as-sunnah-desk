import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { StatusControl } from '@/features/requests/components/status-control'
import type { RequestUpdateResultDto } from '@/features/requests/types'
import type { Result } from '@/lib/result'

const updateStatus = vi.fn()

vi.mock('@/features/requests/actions/update-status', () => ({
  updateStatus: (...args: unknown[]) =>
    updateStatus(...args) as Promise<Result<RequestUpdateResultDto>>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderControl(canEdit = true) {
  return render(
    <TooltipProvider>
      <StatusControl requestId="req_1" status="new" version={1} canEdit={canEdit} />
    </TooltipProvider>,
  )
}

describe('StatusControl', () => {
  afterEach(() => {
    cleanup()
    updateStatus.mockReset()
  })

  it('exposes a status trigger when editing is allowed', () => {
    renderControl()

    expect(screen.getByRole('button', { name: /change status/i })).toBeEnabled()
    expect(screen.getByTestId('status-badge')).toHaveTextContent('New')
  })

  it('renders a read-only badge when canEdit is false', () => {
    renderControl(false)

    expect(screen.getByTestId('status-badge')).toHaveTextContent('New')
    expect(screen.queryByRole('button', { name: /change status/i })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderControl(false)
    const results = await axe(container)

    expect(results.violations).toEqual([])
  })
})
