import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '@/server/auth/dal'
import { getAssigneeOptionsForUser } from '@/server/services/request-permissions.service'

const agent: AuthenticatedUser = {
  id: 'user_agent',
  name: 'Agent User',
  email: 'agent@assunnah.test',
  role: 'agent',
}

const admin: AuthenticatedUser = {
  id: 'user_admin',
  name: 'Admin User',
  email: 'admin@assunnah.test',
  role: 'admin',
}

const assignees = [
  { id: 'user_admin', name: 'Admin User', email: 'admin@assunnah.test', role: 'admin' as const },
  { id: 'user_agent', name: 'Agent User', email: 'agent@assunnah.test', role: 'agent' as const },
  {
    id: 'user_manager',
    name: 'Manager User',
    email: 'manager@assunnah.test',
    role: 'manager' as const,
  },
]

describe('getAssigneeOptionsForUser', () => {
  it('returns every assignable user for roles that can assign others', () => {
    expect(getAssigneeOptionsForUser(admin, assignees)).toEqual([
      { id: 'user_admin', name: 'Admin User' },
      { id: 'user_agent', name: 'Agent User' },
      { id: 'user_manager', name: 'Manager User' },
    ])
  })

  it('returns only the current user when assign:others is missing', () => {
    expect(getAssigneeOptionsForUser(agent, assignees)).toEqual([
      { id: 'user_agent', name: 'Agent User' },
    ])
  })
})
