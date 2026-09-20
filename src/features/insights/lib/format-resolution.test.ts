import { describe, expect, it } from 'vitest'

import { formatResolutionRate, formatResolutionTime } from '@/features/insights/lib/format-resolution'

describe('formatResolutionTime', () => {
  it('formats hours for short durations', () => {
    expect(formatResolutionTime(3_600_000)).toBe('1.0 h')
  })

  it('formats days for long durations', () => {
    expect(formatResolutionTime(86_400_000)).toBe('1.0 d')
  })

  it('returns an em dash for null values', () => {
    expect(formatResolutionTime(null)).toBe('—')
  })
})

describe('formatResolutionRate', () => {
  it('formats rates as percentages', () => {
    expect(formatResolutionRate(0.756)).toBe('76%')
  })
})
