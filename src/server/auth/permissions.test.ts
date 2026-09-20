import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '@/server/auth/dal'
import { can, CAPABILITIES } from '@/server/auth/permissions'

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

describe('permissions', () => {
  it('defines capabilities for every role', () => {
    expect(CAPABILITIES.admin).toContain('request:read:all')
    expect(CAPABILITIES.agent).toContain('request:read:assigned')
    expect(CAPABILITIES.viewer).not.toContain('request:update:status')
  })

  it('grants admin update capabilities', () => {
    expect(can(admin, 'request:update:status')).toBe(true)
    expect(can(admin, 'request:assign:others')).toBe(true)
  })

  it('scopes agent read access to assigned requests only', () => {
    expect(can(agent, 'request:read:assigned')).toBe(true)
    expect(can(agent, 'request:read:all')).toBe(false)
  })

  it('prevents viewers from mutating requests', () => {
    expect(can(viewer, 'request:read:all')).toBe(true)
    expect(can(viewer, 'request:update:status')).toBe(false)
  })
})
