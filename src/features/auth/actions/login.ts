'use server'

import type { Route } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { loginWithCredentials } from '@/server/services/auth.service'

import type { LoginState } from '../types'

async function getClientIp(): Promise<string> {
  const headerList = await headers()
  return (
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const result = await loginWithCredentials(
    {
      email: formData.get('email'),
      password: formData.get('password'),
      next: formData.get('next') ?? '/requests',
    },
    await getClientIp(),
  )

  if (!result.ok) {
    return { error: result.error }
  }

  redirect(result.data.next as Route)
}
