export type { LoginError, LoginState } from '@/lib/auth/login'
export { initialLoginState } from '@/lib/auth/login'

export type SessionUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: 'admin' | 'manager' | 'agent' | 'viewer'
}
