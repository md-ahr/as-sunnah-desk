import type { AuthenticatedUser } from '@/server/auth/dal'
import { can } from '@/server/auth/permissions'

export function canUpdateRequestStatus(
  user: AuthenticatedUser,
  request: { readonly assignee: { readonly id: string } | null },
): boolean {
  if (!can(user, 'request:update:status')) {
    return false
  }

  if (can(user, 'request:read:all')) {
    return true
  }

  return request.assignee?.id === user.id
}

export function canUpdateRequestAssignee(
  user: AuthenticatedUser,
  request: { readonly assignee: { readonly id: string } | null },
): boolean {
  if (!can(user, 'request:update:assignee')) {
    return false
  }

  if (can(user, 'request:read:all')) {
    return true
  }

  return request.assignee?.id === user.id
}

export function canAssignToUser(user: AuthenticatedUser, assigneeId: string | null): boolean {
  if (assigneeId === null || assigneeId === user.id) {
    return true
  }

  return can(user, 'request:assign:others')
}
