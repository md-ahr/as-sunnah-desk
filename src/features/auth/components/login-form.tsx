'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { login } from '../actions/login'
import { messageFor } from '../lib/messages'
import type { LoginState } from '../types'
import { initialLoginState } from '../types'

import { LoginField } from './login-field'

type LoginFormProps = {
  next?: string
}

function fieldError(state: LoginState, field: string): string | undefined {
  if (!state.error || !('fields' in state.error)) return undefined
  return state.error.fields[field]?.[0]
}

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialLoginState)

  useEffect(() => {
    if (state.error && !('fields' in state.error)) {
      toast.error(messageFor(state.error))
    }
  }, [state.error])

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? '/requests'} />

      <LoginField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={fieldError(state, 'email')}
      />
      <LoginField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldError(state, 'password')}
      />

      {state.error && !('fields' in state.error) ? (
        <p role="alert" className="text-sm text-destructive">
          {messageFor(state.error)}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-10 w-full px-4">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
