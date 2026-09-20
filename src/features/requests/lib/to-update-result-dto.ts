import type { RequestUpdateResultDto } from '@/features/requests/types'
import type { RequestUpdateResult } from '@/server/services/request-update.types'

export function toUpdateResultDto(result: RequestUpdateResult): RequestUpdateResultDto {
  return {
    id: result.id,
    reference: result.reference,
    status: result.status,
    version: result.version,
    assignee: result.assignee,
    resolvedAt: result.resolvedAt?.toISOString() ?? null,
    updatedAt: result.updatedAt.toISOString(),
  }
}
