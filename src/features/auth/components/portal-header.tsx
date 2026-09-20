import { PortalNav } from '@/features/auth/components/portal-nav'
import { UserMenu } from '@/features/auth/components/user-menu'
import { getCurrentUser } from '@/server/services/session.service'

export async function PortalHeader() {
  const user = await getCurrentUser()

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <p className="text-sm font-semibold tracking-tight">As-Sunnah Desk</p>
          <PortalNav />
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  )
}
