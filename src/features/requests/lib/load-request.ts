import { cache } from 'react'

import { getByReference } from '@/server/services/request.service'
import { getCurrentUser } from '@/server/services/session.service'
import type { RequestDetailDto } from '@/features/requests/types'

export const loadRequestByReference = cache(
  async (reference: string): Promise<RequestDetailDto | null> => {
    await getCurrentUser()
    return getByReference(reference)
  },
)
