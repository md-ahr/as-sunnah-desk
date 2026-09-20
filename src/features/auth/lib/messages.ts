import type { LoginError } from '@/features/auth/types'

export function messageFor(error: LoginError): string {
  switch (error.code) {
    case 'VALIDATION':
      return 'Please fix the errors below.'
    case 'RATE_LIMITED':
      return 'Too many sign-in attempts. Please wait and try again.'
    case 'UNAUTHORIZED':
      return 'Invalid email or password.'
    default:
      return error.message
  }
}
