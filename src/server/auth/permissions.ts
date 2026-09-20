import type { UserRole } from '@/server/db/schema'

import type { AuthenticatedUser } from './dal'

export type Capability =
  | 'request:read:all'
  | 'request:read:assigned'
  | 'request:update:status'
  | 'request:update:assignee'
  | 'request:assign:others'

export const CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: [
    'request:read:all',
    'request:update:status',
    'request:update:assignee',
    'request:assign:others',
  ],
  manager: [
    'request:read:all',
    'request:update:status',
    'request:update:assignee',
    'request:assign:others',
  ],
  agent: ['request:read:assigned', 'request:update:status', 'request:update:assignee'],
  viewer: ['request:read:all'],
}

export function can(user: AuthenticatedUser, capability: Capability): boolean {
  return CAPABILITIES[user.role].includes(capability)
}
