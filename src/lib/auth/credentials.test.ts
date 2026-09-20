import { describe, expect, it } from 'vitest'

import { credentialsSchema } from '@/lib/auth/credentials'

describe('credentialsSchema', () => {
  it('accepts valid credentials', () => {
    const result = credentialsSchema.safeParse({
      email: 'admin@assunnah.test',
      password: 'test.admin',
      next: '/requests',
    })

    expect(result.success).toBe(true)
  })

  it('rejects external redirect paths', () => {
    const result = credentialsSchema.safeParse({
      email: 'admin@assunnah.test',
      password: 'test.admin',
      next: '//evil.example',
    })

    expect(result.success).toBe(false)
  })
})
