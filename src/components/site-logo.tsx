import Link from 'next/link'
import Image from 'next/image'

import { cn } from '@/lib/utils'

type SiteLogoProps = {
  className?: string
  linked?: boolean
  /** Always show the product name. Default hides it on small screens for compact headers. */
  showName?: boolean
}

export function SiteLogo({ className, linked = true, showName = false }: SiteLogoProps) {
  const logo = (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={114}
        height={73}
        unoptimized
        priority
        className="h-8 w-auto shrink-0"
      />
      <span
        className={cn(
          'text-foreground text-sm font-semibold tracking-tight',
          showName ? 'inline truncate' : 'sr-only sm:inline sm:truncate',
        )}
      >
        As-Sunnah Desk
      </span>
    </span>
  )

  if (!linked) {
    return logo
  }

  return (
    <Link
      href="/requests"
      className="focus-visible:ring-ring min-w-0 rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {logo}
    </Link>
  )
}
