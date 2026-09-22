import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardNavigationProvider } from '@/features/requests/components/dashboard-navigation'
import { SearchInput } from '@/features/requests/components/search-input'
import { parseSearchParams } from '@/lib/search-params/schema'

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces form submission and clears pagination params', () => {
    const params = parseSearchParams({ page: '2' })
    const requestSubmit = vi.fn()

    render(
      <DashboardNavigationProvider>
        <SearchInput params={params} />
      </DashboardNavigationProvider>,
    )

    const form = screen.getByRole('searchbox', { name: 'Search requests' }).closest('form')
    expect(form).not.toBeNull()
    vi.spyOn(form as HTMLFormElement, 'requestSubmit').mockImplementation(requestSubmit)

    fireEvent.change(screen.getByLabelText('Search requests'), {
      target: { value: 'SR-2026' },
    })

    expect(requestSubmit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(requestSubmit).toHaveBeenCalledTimes(1)
    expect(form).toHaveAttribute('action', '/requests')
    expect(screen.getByLabelText('Search requests')).toHaveValue('SR-2026')
    expect(form?.querySelector('input[name="page"]')).toBeNull()
  })
})
