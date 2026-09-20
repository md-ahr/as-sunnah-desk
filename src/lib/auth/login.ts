import type { AppError } from '@/lib/app-error'

export type LoginValidationError = {
  readonly code: 'VALIDATION'
  readonly fields: Record<string, string[] | undefined>
}

export type LoginError = LoginValidationError | AppError

export type LoginState = {
  readonly error: LoginError | null
}

export const initialLoginState: LoginState = { error: null }
