import { describe, expect, it } from 'vitest'

import { err, isErr, isOk, ok } from '@/lib/result'

describe('result', () => {
  it('narrows ok results', () => {
    const result = ok({ id: '1' })
    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.data.id).toBe('1')
    }
  })

  it('narrows err results', () => {
    const result = err({ code: 'VALIDATION' as const, message: 'Invalid input' })
    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.code).toBe('VALIDATION')
    }
  })
})
