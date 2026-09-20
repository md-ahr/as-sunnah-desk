import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '@/server/auth/dal'
import {
  canAssignToUser,
  canUpdateRequestAssignee,
  canUpdateRequestStatus,
} from '@/server/auth/request-permissions'

const admin: AuthenticatedUser = {
  id: 'user_admin',
  name: 'Admin User',
  email: 'admin@assunnah.test',
  role: 'admin',
}

const agent: AuthenticatedUser = {
  id: 'user_agent',
  name: 'Agent User',
  email: 'agent@assunnah.test',
  role: 'agent',
}

const viewer: AuthenticatedUser = {
  id: 'user_viewer',
  name: 'Viewer User',
  email: 'viewer@assunnah.test',
  role: 'viewer',
}

describe('request write permissions', () => {
  it('lets admins update any request', () => {
    const unassigned = { assignee: null }

    expect(canUpdateRequestStatus(admin, unassigned)).toBe(true)
    expect(canUpdateRequestAssignee(admin, unassigned)).toBe(true)
    expect(canAssignToUser(admin, 'user_agent')).toBe(true)
  })

  it('lets agents update only their assigned requests and themselves', () => {
    const assigned = { assignee: { id: 'user_agent' } }
    const other = { assignee: { id: 'user_admin' } }

    expect(canUpdateRequestStatus(agent, assigned)).toBe(true)
    expect(canUpdateRequestStatus(agent, other)).toBe(false)
    expect(canUpdateRequestAssignee(agent, assigned)).toBe(true)
    expect(canAssignToUser(agent, 'user_agent')).toBe(true)
    expect(canAssignToUser(agent, null)).toBe(true)
    expect(canAssignToUser(agent, 'user_admin')).toBe(false)
  })

  it('blocks viewers from status and assignee updates', () => {
    const assigned = { assignee: { id: 'user_viewer' } }

    expect(canUpdateRequestStatus(viewer, assigned)).toBe(false)
    expect(canUpdateRequestAssignee(viewer, assigned)).toBe(false)
  })
})
