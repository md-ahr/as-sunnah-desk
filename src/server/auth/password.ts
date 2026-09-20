import 'server-only'

import { hash, verify } from '@node-rs/argon2'

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const

const DUMMY_PLAIN_PASSWORD = 'timing-safe-dummy-password-not-for-login'

let dummyHashPromise: Promise<string> | null = null

async function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hash(DUMMY_PLAIN_PASSWORD, ARGON2_OPTIONS)
  return dummyHashPromise
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plain, ARGON2_OPTIONS)
  } catch {
    return false
  }
}

/** Always verify against a real hash, even when the email is unknown. */
export async function verifyPasswordOrDummy(
  plain: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  const hashToVerify = passwordHash ?? (await getDummyHash())
  return verifyPassword(plain, hashToVerify)
}
