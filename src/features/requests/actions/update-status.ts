'use server'

import { err } from '@/lib/result'
import type { Result } from '@/lib/result'
import { requireUser } from '@/server/services/session.service'
import {
  updateStatus as updateStatusService,
  type RequestUpdateResult,
} from '@/server/services/request.service'

import { parseUpdateStatusInput } from '../schemas/update'

export async function updateStatus(input: unknown): Promise<Result<RequestUpdateResult>> {
  const parsed = parseUpdateStatusInput(input)
  if (!parsed.ok) {
    return err({ code: 'VALIDATION', message: 'Invalid status update.', details: { fields: parsed.fields } })
  }

  const auth = await requireUser()
  if (!auth.ok) {
    return auth
  }

  return updateStatusService(auth.data, parsed.data)
}
