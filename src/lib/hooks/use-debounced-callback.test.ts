import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('fires once after 300 ms of quiet', () => {
    const fn = vi.fn<(value: string) => void>()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))

    act(() => {
      result.current('a')
      result.current('ab')
      vi.advanceTimersByTime(299)
    })
    expect(fn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('ab')
  })

  it('cancels pending call on unmount', () => {
    const fn = vi.fn<(value: string) => void>()
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 300))

    act(() => {
      result.current('pending')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(fn).not.toHaveBeenCalled()
  })
})
