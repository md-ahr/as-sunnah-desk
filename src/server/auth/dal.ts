import 'server-only'

import { cache } from 'react'
import { cacheLife } from 'next/cache'
import { redirect } from 'next/navigation'

import { appError } from '@/lib/app-error'
import { err, ok } from '@/lib/result'
import type { Result } from '@/lib/result'
import type { UserRole } from '@/server/db/schema'
import { findActiveUserById } from '@/server/repositories/user.repository'

import { getSession } from './session'

export type AuthenticatedUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

const getCachedActiveUser = cache(async (userId: string) => findActiveUserById(userId))

function toAuthenticatedUser(user: {
  id: string
  name: string
  email: string
  role: UserRole
}): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

/** Resolves the session to a live user. Redirects if absent or deactivated. */
export async function getCurrentUser(): Promise<AuthenticatedUser> {
  'use cache: private'
  cacheLife('minutes')

  const { userId } = await getSession()
  if (!userId) redirect('/login')

  const user = await getCachedActiveUser(userId)
  if (!user) redirect('/login')

  return toAuthenticatedUser(user)
}

/** For Server Actions and Route Handlers, which must not redirect mid-mutation. */
export async function requireUser(): Promise<Result<AuthenticatedUser>> {
  const { userId } = await getSession()
  if (!userId) {
    return err(appError('UNAUTHORIZED', 'You must be signed in.'))
  }

  const user = await getCachedActiveUser(userId)
  if (!user) {
    return err(appError('UNAUTHORIZED', 'You must be signed in.'))
  }

  return ok(toAuthenticatedUser(user))
}
