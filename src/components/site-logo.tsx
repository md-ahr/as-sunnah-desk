import Link from 'next/link'

import { cn } from '@/lib/utils'

type SiteLogoProps = {
  className?: string
  linked?: boolean
}

export function SiteLogo({ className, linked = true }: SiteLogoProps) {
  const logo = (
    <img
      src="/logo.svg"
      alt="As-Sunnah Foundation"
      width={114}
      height={73}
      className={cn('h-8 w-auto shrink-0', className)}
    />
  )

  if (!linked) {
    return logo
  }

  return (
    <Link
      href="/requests"
      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {logo}
    </Link>
  )
}
