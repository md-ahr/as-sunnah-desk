'use client'

import { ChartColumnIcon, ClipboardListIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/requests' as const, label: 'Requests', icon: ClipboardListIcon },
  { href: '/insights' as const, label: 'Insights', icon: ChartColumnIcon },
] as const

function isNavActive(pathname: string, href: (typeof NAV_ITEMS)[number]['href']): boolean {
  if (href === '/requests') {
    return pathname === '/requests' || pathname.startsWith('/requests/')
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="bg-muted border-border inline-flex items-center gap-0.5 rounded-lg border p-1"
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href)

        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={active}
          />
        )
      })}
    </nav>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: (typeof NAV_ITEMS)[number]['href']
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors',
        'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'bg-card text-primary ring-border shadow-sm ring-1'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
