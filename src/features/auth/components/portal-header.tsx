import { SiteLogo } from '@/components/site-logo'
import { PortalNav } from '@/features/auth/components/portal-nav'
import { UserMenu } from '@/features/auth/components/user-menu'
import { getCurrentUser } from '@/server/services/session.service'

export async function PortalHeader() {
  const user = await getCurrentUser()

  return (
    <header className="border-border bg-card sticky top-0 z-10 border-b">
      <div className="mx-auto grid h-14 max-w-[90rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 justify-self-start">
          <SiteLogo />
        </div>
        <PortalNav />
        <div className="min-w-0 justify-self-end">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
