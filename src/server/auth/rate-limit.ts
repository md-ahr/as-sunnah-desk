import 'server-only'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

type AttemptWindow = {
  timestamps: number[]
}

const attempts = new Map<string, AttemptWindow>()

function pruneTimestamps(timestamps: number[], now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < WINDOW_MS)
}

export function checkLoginAttempt(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = attempts.get(key)
  const recent = pruneTimestamps(entry?.timestamps ?? [], now)

  if (recent.length >= MAX_ATTEMPTS) {
    const oldest = recent[0] ?? now
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) }
  }

  return { allowed: true, retryAfterMs: 0 }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  const recent = pruneTimestamps(entry?.timestamps ?? [], now)
  recent.push(now)
  attempts.set(key, { timestamps: recent })
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key)
}

/** Test-only helper to reset in-memory state between tests. */
export function resetLoginRateLimits(): void {
  attempts.clear()
}
