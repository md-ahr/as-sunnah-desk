import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { unsealData } from 'iron-session'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

const PUBLIC_PATHS = new Set(['/login'])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sealed = request.cookies.get(SESSION_COOKIE_NAME)?.value

  let hasSession = false
  if (sealed) {
    try {
      const sessionPassword = process.env.SESSION_PASSWORD
      if (sessionPassword) {
        const data = await unsealData<{ userId?: string }>(sealed, {
          password: sessionPassword,
        })
        hasSession = Boolean(data.userId)
      }
    } catch {
      hasSession = false
    }
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = hasSession ? '/requests' : '/login'
    if (!hasSession) {
      url.searchParams.set('next', '/requests')
    }
    return NextResponse.redirect(url)
  }

  if (!hasSession && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/requests', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}
