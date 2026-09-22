import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SiteLogo } from '@/components/site-logo'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata: Metadata = {
  title: 'Sign in · As-Sunnah Desk',
}

function LoginHeader() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <SiteLogo linked={false} showName className="justify-center [&_img]:h-10" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">Service request management portal</p>
      </div>
    </div>
  )
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? params.next : undefined

  return (
    <div className="space-y-6">
      <LoginHeader />
      <LoginForm next={next} />
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <LoginHeader />
      <div className="space-y-4">
        <div className="bg-muted h-16 animate-pulse rounded-md" />
        <div className="bg-muted h-16 animate-pulse rounded-md" />
        <div className="bg-muted h-10 animate-pulse rounded-md" />
      </div>
    </div>
  )
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}
