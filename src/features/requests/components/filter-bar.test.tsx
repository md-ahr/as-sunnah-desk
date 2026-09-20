import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardNavigationProvider } from '@/features/requests/components/dashboard-navigation'
import { FilterBar } from '@/features/requests/components/filter-bar'
import { parseSearchParams } from '@/lib/search-params/schema'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/requests',
  useSearchParams: () => new URLSearchParams(),
}))

const categories = [
  { id: 'cat-1', name: 'IT Support', slug: 'it-support' },
  { id: 'cat-2', name: 'HR', slug: 'hr' },
]

const assignees = [{ id: 'user-1', name: 'Agent User' }]

const facets = {
  status: { new: 3, in_progress: 2 },
  priority: { urgent: 1, high: 2 },
  category: { 'cat-1': 4, 'cat-2': 1 },
  assignee: { unassigned: 2, 'user-1': 3 },
  total: 5,
}

describe('FilterBar', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders filter controls and active chips', () => {
    const params = parseSearchParams({ status: 'new', category: 'it-support' })

    render(
      <DashboardNavigationProvider>
        <FilterBar
          params={params}
          categories={categories}
          assignees={assignees}
          facets={facets}
        />
      </DashboardNavigationProvider>,
    )

    expect(screen.getAllByRole('button', { name: 'Filters' }).length).toBeGreaterThan(0)
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('IT Support')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const params = parseSearchParams({})

    const { container } = render(
      <DashboardNavigationProvider>
        <FilterBar
          params={params}
          categories={categories}
          assignees={assignees}
          facets={facets}
        />
      </DashboardNavigationProvider>,
    )

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
