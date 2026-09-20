'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/requests' as const, label: 'Requests' },
  { href: '/insights' as const, label: 'Insights' },
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
    <nav aria-label="Main" className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative inline-flex h-14 items-center px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
