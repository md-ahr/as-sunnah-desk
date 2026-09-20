'use server'

import { redirect } from 'next/navigation'

import { logoutCurrentUser } from '@/server/services/auth.service'

export async function logout(): Promise<void> {
  await logoutCurrentUser()
  redirect('/login')
}
