import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EmptyState } from '@/features/requests/components/empty-state'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/requests',
}))

describe('EmptyState', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the filtered variant with a clear action', () => {
    render(<EmptyState hasActiveFilters={true} />)

    expect(screen.getByRole('status')).toHaveTextContent('No requests match these filters')
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument()
  })

  it('shows the unfiltered variant without a clear action', () => {
    render(<EmptyState hasActiveFilters={false} />)

    expect(screen.getByRole('status')).toHaveTextContent('No service requests yet')
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<EmptyState hasActiveFilters={false} />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
