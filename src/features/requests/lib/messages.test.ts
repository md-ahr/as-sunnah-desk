import { describe, expect, it } from 'vitest'

import { appError } from '@/lib/app-error'
import { messageFor } from '@/features/requests/lib/messages'

describe('update error messages', () => {
  it('includes the current status on conflict', () => {
    const error = appError('CONFLICT', 'This request was changed by someone else.', {
      currentStatus: 'in_review',
      currentVersion: 2,
    })

    expect(messageFor(error)).toBe(
      'This request was changed by someone else. It is now In review.',
    )
  })
})
