'use client'

import { useId, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { updateStatus } from '@/features/requests/actions/update-status'
import { messageFor, successMessageForStatus } from '@/features/requests/lib/messages'
import { statusLabel } from '@/features/requests/lib/labels'
import { StatusBadge } from '@/features/requests/components/status-badge'
import type { RequestStatus } from '@/lib/search-params/request-enums'
import { allowedTransitions } from '@/server/services/request-status.machine'
import { cn } from '@/lib/utils'

type StatusControlProps = {
  requestId: string
  status: RequestStatus
  version: number
  canEdit: boolean
  disabledReason?: string
  className?: string
}

export function StatusControl({
  requestId,
  status,
  version,
  canEdit,
  disabledReason = 'You do not have permission to change the status.',
  className,
}: StatusControlProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status)
  const [isPending, startTransition] = useTransition()
  const labelId = useId()
  const options = allowedTransitions(optimisticStatus)

  function onSelect(next: RequestStatus) {
    if (!canEdit || isPending || next === optimisticStatus) {
      return
    }

    startTransition(async () => {
      setOptimisticStatus(next)

      const result = await updateStatus({
        id: requestId,
        status: next,
        version,
        idempotencyKey: crypto.randomUUID(),
      })

      if (!result.ok) {
        toast.error(messageFor(result.error), {
          action:
            result.error.code === 'CONFLICT'
              ? { label: 'Reload', onClick: () => window.location.reload() }
              : undefined,
        })
        return
      }

      toast.success(successMessageForStatus(next))
    })
  }

  const badge = (
    <StatusBadge status={optimisticStatus} data-testid="status-badge" className={className} />
  )

  if (!canEdit) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>{badge}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <span id={labelId} className="sr-only">
        Status for request {requestId}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-labelledby={labelId}
          disabled={isPending || options.length === 0}
          className={cn(
            'inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isPending && 'opacity-70',
          )}
        >
          {badge}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map((option) => (
            <DropdownMenuItem key={option} onClick={() => onSelect(option)}>
              {statusLabel(option)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
