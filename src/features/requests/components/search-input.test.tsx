import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardNavigationProvider } from '@/features/requests/components/dashboard-navigation'
import { SearchInput } from '@/features/requests/components/search-input'
import { parseSearchParams } from '@/lib/search-params/schema'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/requests',
  useSearchParams: () => new URLSearchParams('page=2'),
}))

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    replace.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces router.replace and clears pagination params', async () => {
    const params = parseSearchParams({ page: '2' })

    render(
      <DashboardNavigationProvider>
        <SearchInput params={params} />
      </DashboardNavigationProvider>,
    )

    fireEvent.change(screen.getByLabelText('Search requests'), {
      target: { value: 'SR-2026' },
    })

    expect(replace).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(replace).toHaveBeenCalledWith('/requests?q=SR-2026', { scroll: false })
  })
})
