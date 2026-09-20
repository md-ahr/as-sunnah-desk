import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/requests' as const, label: 'Requests' },
  { href: '/insights' as const, label: 'Insights' },
]

export function PortalNav() {
  return (
    <nav aria-label="Main" className="flex items-center gap-4">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
