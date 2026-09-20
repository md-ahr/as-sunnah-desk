import { z } from 'zod'

import { REQUEST_STATUSES } from '@/lib/search-params/request-enums'

export const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(REQUEST_STATUSES),
  version: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const updateAssigneeSchema = z.object({
  id: z.string().min(1),
  assigneeId: z.string().min(1).nullable(),
  version: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
})

export type UpdateAssigneeInput = z.infer<typeof updateAssigneeSchema>

function validationFields(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string') {
      fields[field] = [...(fields[field] ?? []), issue.message]
    }
  }

  return fields
}

export function parseUpdateStatusInput(input: unknown) {
  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, fields: validationFields(parsed.error) }
  }

  return { ok: true as const, data: parsed.data }
}

export function parseUpdateAssigneeInput(input: unknown) {
  const parsed = updateAssigneeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, fields: validationFields(parsed.error) }
  }

  return { ok: true as const, data: parsed.data }
}
