import 'server-only'

import type { AuthenticatedUser } from '@/server/auth/dal'
import { can } from '@/server/auth/permissions'
import { canUpdateRequestAssignee, canUpdateRequestStatus } from '@/server/auth/request-permissions'
import type { AssignableUserDto } from '@/server/repositories/reference.repository'

export { can } from '@/server/auth/permissions'
export { canUpdateRequestAssignee, canUpdateRequestStatus }

export type AssigneeOption = {
  readonly id: string
  readonly name: string
}

export function getAssigneeOptionsForUser(
  user: AuthenticatedUser,
  assignees: readonly AssignableUserDto[],
): AssigneeOption[] {
  if (can(user, 'request:assign:others')) {
    return assignees.map(({ id, name }) => ({ id, name }))
  }

  return assignees
    .filter((assignee) => assignee.id === user.id)
    .map(({ id, name }) => ({ id, name }))
}
