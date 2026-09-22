import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ActiveFilterChip } from '@/features/requests/components/active-filter-chip'
import { DashboardNavigationProvider } from '@/features/requests/components/dashboard-navigation'

const replace = vi.fn()
const startNavigation = vi.fn((callback: () => void) => {
  callback()
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/requests',
  useSearchParams: () => new URLSearchParams('status=new&status=in_review&category=it-support'),
}))

vi.mock('@/features/requests/components/dashboard-navigation', async () => {
  const actual = await vi.importActual<typeof import('@/features/requests/components/dashboard-navigation')>(
    '@/features/requests/components/dashboard-navigation',
  )

  return {
    ...actual,
    useDashboardNavigation: () => ({
      isPending: false,
      startNavigation,
    }),
  }
})

describe('ActiveFilterChip', () => {
  afterEach(() => {
    cleanup()
    replace.mockReset()
    startNavigation.mockClear()
  })

  it('removes one active filter value and clears pagination params', () => {
    render(
      <DashboardNavigationProvider>
        <ActiveFilterChip label="New" param="status" value="new" />
      </DashboardNavigationProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove New filter' }))

    expect(replace).toHaveBeenCalledOnce()
    const [href, options] = replace.mock.calls[0] ?? []
    expect(href).toBe('/requests?category=it-support&status=in_review')
    expect(options).toEqual({ scroll: false })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DashboardNavigationProvider>
        <ActiveFilterChip label="New" param="status" value="new" />
      </DashboardNavigationProvider>,
    )

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
