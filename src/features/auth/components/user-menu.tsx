'use client'

import { ChevronDownIcon, LogOutIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SessionUser } from '@/features/auth/types'
import { cn } from '@/lib/utils'

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
    <>
      <form id="portal-logout-form" action={logout} hidden />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Account menu, ${user.name}`}
          className={cn(
            'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-1.5',
            'text-foreground text-sm font-medium outline-none',
            'hover:bg-accent',
            'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
            'sm:min-h-9 sm:min-w-0 sm:px-2',
          )}
        >
          <Avatar size="sm">
            <AvatarFallback className="font-medium">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span aria-hidden="true" className="hidden max-w-40 truncate sm:inline">
            {user.name}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground hidden size-3.5 sm:block"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-foreground truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              const form = document.getElementById('portal-logout-form')
              if (form instanceof HTMLFormElement) {
                form.requestSubmit()
              }
            }}
          >
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
