'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useId, useOptimistic, useRef, useTransition } from 'react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { updateStatus } from '@/features/requests/actions/update-status'
import { useMutationVersion } from '@/features/requests/hooks/use-mutation-version'
import { messageFor, successMessageForStatus } from '@/features/requests/lib/messages'
import { statusLabel } from '@/features/requests/lib/labels'
import { StatusBadge } from '@/features/requests/components/status-badge'
import type { RequestUpdateResultDto } from '@/features/requests/types'
import { allowedTransitions } from '@/lib/request-status'
import type { RequestStatus } from '@/lib/search-params/request-enums'
import type { Result } from '@/lib/result'
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
  const { getVersion, setVersion } = useMutationVersion(requestId, version)
  const [isPending, startTransition] = useTransition()
  const inFlightRef = useRef<{ key: string; target: RequestStatus } | null>(null)
  const inFlightCountRef = useRef(0)
  const labelId = useId()
  const options = allowedTransitions(optimisticStatus)

  function onSelect(next: RequestStatus) {
    if (!canEdit || isPending || next === optimisticStatus) {
      return
    }

    const idempotencyKey =
      inFlightRef.current?.target === next ? inFlightRef.current.key : crypto.randomUUID()
    inFlightRef.current = { key: idempotencyKey, target: next }
    inFlightCountRef.current += 1

    startTransition(async () => {
      setOptimisticStatus(next)

      try {
        const result: Result<RequestUpdateResultDto> = await updateStatus({
          id: requestId,
          status: next,
          version: getVersion(),
          idempotencyKey,
        })

        if (!result.ok) {
          toast.error(messageFor(result.error), {
            action:
              result.error.code === 'CONFLICT'
                ? {
                    label: 'Reload',
                    onClick: () => {
                      window.location.reload()
                    },
                  }
                : undefined,
          })
          return
        }

        setVersion(result.data.version)
        toast.success(successMessageForStatus(next))
      } catch {
        toast.error('The status update could not be completed.')
      } finally {
        inFlightCountRef.current -= 1
        if (inFlightCountRef.current === 0) {
          inFlightRef.current = null
        }
      }
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

  if (options.length === 0) {
    return badge
  }

  return (
    <>
      <span id={labelId} className="sr-only">
        Change status, currently {statusLabel(optimisticStatus)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-labelledby={labelId}
          disabled={isPending}
          className={cn(
            'focus-visible:ring-ring border-border bg-background hover:bg-muted inline-flex h-7 items-center gap-1 rounded-full border pr-1.5 pl-0.5 outline-none focus-visible:ring-2',
            isPending && 'opacity-70',
          )}
        >
          {badge}
          <ChevronDownIcon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Change status</DropdownMenuLabel>
            {options.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => {
                  onSelect(option)
                }}
              >
                {statusLabel(option)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
