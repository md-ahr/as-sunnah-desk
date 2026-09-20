import 'server-only'

import { cookies } from 'next/headers'
import { sealData, unsealData } from 'iron-session'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { env } from '@/server/env'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export type SessionData = {
  userId?: string
}

export async function getSession(): Promise<SessionData> {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!cookie) return {}

  try {
    return await unsealData<SessionData>(cookie, { password: env.SESSION_PASSWORD })
  } catch {
    return {}
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS)
  const sealed = await sealData({ userId }, { password: env.SESSION_PASSWORD })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, sealed, {
    httpOnly: true,
    // Production builds on localhost (E2E) still use http://127.0.0.1 — secure cookies would not persist.
    secure: process.env.NODE_ENV === 'production' && Boolean(process.env.VERCEL),
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE_NAME)
}
