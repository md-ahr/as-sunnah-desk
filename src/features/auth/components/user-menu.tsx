'use client'

import { Button } from '@/components/ui/button'
import type { SessionUser } from '@/features/auth/types'

import { logout } from '../actions/logout'

type UserMenuProps = {
  user: SessionUser
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  const second = parts[1]

  if (!first) return '?'
  if (!second) return first.slice(0, 2).toUpperCase()
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase()
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      >
        {initials(user.name)}
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  )
}
