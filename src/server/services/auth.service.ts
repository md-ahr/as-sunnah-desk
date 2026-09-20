import 'server-only'

import { createHash } from 'node:crypto'

import { appError } from '@/lib/app-error'
import { err, ok } from '@/lib/result'
import type { Result } from '@/lib/result'
import { verifyPasswordOrDummy } from '@/server/auth/password'
import {
  checkLoginAttempt,
  clearLoginAttempts,
  recordLoginFailure,
} from '@/server/auth/rate-limit'
import { createSession, deleteSession } from '@/server/auth/session'
import { findUserByEmail } from '@/server/repositories/user.repository'

import { credentialsSchema } from '@/lib/auth/credentials'
import type { LoginError } from '@/lib/auth/login'

function rateLimitKey(ip: string, email: string): string {
  return createHash('sha256').update(`${ip}:${email.toLowerCase()}`).digest('hex')
}

export async function loginWithCredentials(
  input: unknown,
  ip: string,
): Promise<Result<{ userId: string; next: string }, LoginError>> {
  const parsed = credentialsSchema.safeParse(input)

  if (!parsed.success) {
    const fields: Record<string, string[] | undefined> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') {
        fields[field] = [...(fields[field] ?? []), issue.message]
      }
    }

    return err({
      code: 'VALIDATION',
      fields,
    })
  }

  const limitKey = rateLimitKey(ip, parsed.data.email)
  const rateCheck = checkLoginAttempt(limitKey)

  if (!rateCheck.allowed) {
    return err(
      appError('RATE_LIMITED', 'Too many sign-in attempts. Please wait and try again.'),
    )
  }

  const user = await findUserByEmail(parsed.data.email)
  const passwordValid = await verifyPasswordOrDummy(
    parsed.data.password,
    user?.isActive ? user.passwordHash : null,
  )

  if (!user || !user.isActive || !passwordValid) {
    recordLoginFailure(limitKey)
    return err(appError('UNAUTHORIZED', 'Invalid email or password.'))
  }

  clearLoginAttempts(limitKey)
  await createSession(user.id)

  return ok({ userId: user.id, next: parsed.data.next })
}

export async function logoutCurrentUser(): Promise<void> {
  await deleteSession()
}
