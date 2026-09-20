'use server'

import { err } from '@/lib/result'
import type { Result } from '@/lib/result'
import { requireUser } from '@/server/services/session.service'
import {
  updateAssignee as updateAssigneeService,
  type RequestUpdateResult,
} from '@/server/services/request.service'

import { parseUpdateAssigneeInput } from '../schemas/update'

export async function updateAssignee(input: unknown): Promise<Result<RequestUpdateResult>> {
  const parsed = parseUpdateAssigneeInput(input)
  if (!parsed.ok) {
    return err({
      code: 'VALIDATION',
      message: 'Invalid assignee update.',
      details: { fields: parsed.fields },
    })
  }

  const auth = await requireUser()
  if (!auth.ok) {
    return auth
  }

  return updateAssigneeService(auth.data, parsed.data)
}
