'use server'

import { revalidateTag, updateTag } from 'next/cache'

import { appError } from '@/lib/app-error'
import { err, ok } from '@/lib/result'
import type { Result } from '@/lib/result'
import { tags } from '@/server/cache/tags'
import { updateStatus as updateStatusService } from '@/server/services/request.service'
import { requireUser } from '@/server/services/session.service'

import { toUpdateResultDto } from '../lib/to-update-result-dto'
import { parseUpdateStatusInput } from '../schemas/update'
import type { RequestUpdateResultDto } from '../types'

function invalidateAfterUpdate(requestId: string): void {
  updateTag(tags.request(requestId))
  updateTag(tags.requestActivity(requestId))
  updateTag(tags.assigneeSummary())
  revalidateTag(tags.facetCounts(), 'max')
}

export async function updateStatus(input: unknown): Promise<Result<RequestUpdateResultDto>> {
  const parsed = parseUpdateStatusInput(input)
  if (!parsed.ok) {
    return err(appError('VALIDATION', 'Invalid status update.', { fields: parsed.fields }))
  }

  const auth = await requireUser()
  if (!auth.ok) {
    return auth
  }

  const result = await updateStatusService(auth.data, parsed.data)
  if (!result.ok) {
    return result
  }

  invalidateAfterUpdate(parsed.data.id)
  return ok(toUpdateResultDto(result.data))
}
