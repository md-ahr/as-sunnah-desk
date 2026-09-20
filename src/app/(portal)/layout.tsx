import { Suspense } from 'react'

import { PortalHeader } from '@/features/auth/components/portal-header'
import { PortalHeaderSkeleton } from '@/features/auth/components/portal-header-skeleton'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Suspense fallback={<PortalHeaderSkeleton />}>
        <PortalHeader />
      </Suspense>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
