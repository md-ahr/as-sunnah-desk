import { io } from 'next/cache'

/** Request-time clock. `await io()` keeps `Date.now()` out of the Cache Components prerender. */
export async function getRequestNow(): Promise<number> {
  await io()
  return Date.now()
}
