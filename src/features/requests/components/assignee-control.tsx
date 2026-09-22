'use client'

import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import { toast } from 'sonner'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { updateAssignee } from '@/features/requests/actions/update-assignee'
import { useMutationVersion } from '@/features/requests/hooks/use-mutation-version'
import { messageFor, successMessageForAssignee } from '@/features/requests/lib/messages'
import type { AssigneeOption, RequestUpdateResultDto } from '@/features/requests/types'
import type { Result } from '@/lib/result'
import { cn } from '@/lib/utils'

const UNASSIGNED_VALUE = '__unassigned__'
const VIRTUAL_THRESHOLD = 50

type AssigneeControlProps = {
  requestId: string
  assignee: AssigneeOption | null
  version: number
  canEdit: boolean
  options: readonly AssigneeOption[]
  disabledReason?: string
  showTrigger?: boolean
}

export function AssigneeControl({
  requestId,
  assignee,
  version,
  canEdit,
  options,
  disabledReason = 'You do not have permission to change the assignee.',
  showTrigger = false,
}: AssigneeControlProps) {
  const router = useRouter()
  const [committedAssignee, setCommittedAssignee] = useState(assignee)
  const [prevSyncedAssigneeId, setPrevSyncedAssigneeId] = useState<string | null>(
    assignee?.id ?? null,
  )
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic(committedAssignee)
  const { getVersion, setVersion } = useMutationVersion(requestId, version)
  const [isPending, startTransition] = useTransition()
  const inFlightRef = useRef<{ key: string; target: string | null } | null>(null)
  const inFlightCountRef = useRef(0)
  const anchorRef = useComboboxAnchor()

  const assigneeId = assignee?.id ?? null
  if (assigneeId !== prevSyncedAssigneeId) {
    setPrevSyncedAssigneeId(assigneeId)
    setCommittedAssignee(assignee)
  }

  const labelsByValue = useMemo(() => {
    const labels = new Map<string, string>([[UNASSIGNED_VALUE, 'Unassigned']])
    for (const option of options) {
      labels.set(option.id, option.name)
    }
    if (committedAssignee) {
      labels.set(committedAssignee.id, committedAssignee.name)
    }
    return labels
  }, [options, committedAssignee])

  const values = useMemo(() => [UNASSIGNED_VALUE, ...options.map((option) => option.id)], [options])

  const selectedValue = optimisticAssignee?.id ?? UNASSIGNED_VALUE
  const selectedLabel = optimisticAssignee?.name ?? 'Unassigned'

  function onValueChange(nextValue: string | null) {
    if (!canEdit || isPending || nextValue === null) {
      return
    }

    const nextAssigneeId = nextValue === UNASSIGNED_VALUE ? null : nextValue
    const nextAssignee =
      nextAssigneeId === null
        ? null
        : (options.find((option) => option.id === nextAssigneeId) ?? null)

    if ((optimisticAssignee?.id ?? null) === nextAssigneeId) {
      return
    }

    const idempotencyKey =
      inFlightRef.current?.target === nextAssigneeId ? inFlightRef.current.key : crypto.randomUUID()
    inFlightRef.current = { key: idempotencyKey, target: nextAssigneeId }
    inFlightCountRef.current += 1

    startTransition(async () => {
      setOptimisticAssignee(nextAssignee)

      try {
        const result: Result<RequestUpdateResultDto> = await updateAssignee({
          id: requestId,
          assigneeId: nextAssigneeId,
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

        setCommittedAssignee(result.data.assignee)
        setVersion(result.data.version)
        router.refresh()
        toast.success(successMessageForAssignee(result.data.assignee?.name ?? null))
      } catch {
        toast.error('The assignee update could not be completed.')
      } finally {
        inFlightCountRef.current -= 1
        if (inFlightCountRef.current === 0) {
          inFlightRef.current = null
        }
      }
    })
  }

  const display = (
    <span data-testid="assignee-control" className={cn('text-sm', isPending && 'opacity-70')}>
      {selectedLabel}
    </span>
  )

  if (!canEdit) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>{display}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div ref={anchorRef} className="w-full max-w-xs">
      <Combobox
        value={selectedValue}
        onValueChange={onValueChange}
        disabled={isPending}
        itemToStringLabel={(value) => labelsByValue.get(value) ?? value}
      >
        <ComboboxInput
          aria-label="Assignee"
          placeholder={selectedLabel}
          showTrigger={showTrigger}
          showClear={false}
          className="bg-background w-full"
        />
        <ComboboxContent anchor={anchorRef}>
          <AssigneeOptionsList
            values={values}
            labelsByValue={labelsByValue}
            virtualized={values.length > VIRTUAL_THRESHOLD}
          />
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function AssigneeOptionsList({
  values,
  labelsByValue,
  virtualized,
}: {
  values: readonly string[]
  labelsByValue: ReadonlyMap<string, string>
  virtualized: boolean
}) {
  if (!virtualized) {
    return (
      <ComboboxList>
        {values.map((value) => (
          <ComboboxItem key={value} value={value}>
            {labelsByValue.get(value) ?? value}
          </ComboboxItem>
        ))}
        <ComboboxEmpty>No assignees found</ComboboxEmpty>
      </ComboboxList>
    )
  }

  return <VirtualizedAssigneeOptionsList values={values} labelsByValue={labelsByValue} />
}

function VirtualizedAssigneeOptionsList({
  values,
  labelsByValue,
}: {
  values: readonly string[]
  labelsByValue: ReadonlyMap<string, string>
}) {
  const listRef = useRef<HTMLDivElement>(null)

  // TanStack Virtual returns unstable function refs; safe here in an isolated list renderer.
  // eslint-disable-next-line react-hooks/incompatible-library -- large assignee lists need virtualization
  const virtualizer = useVirtualizer({
    count: values.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 32,
    overscan: 8,
  })

  return (
    <ComboboxList>
      <div ref={listRef} className="max-h-60 overflow-auto">
        <div
          style={{
            height: `${String(virtualizer.getTotalSize())}px`,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const value = values[virtualRow.index]
            if (!value) {
              return null
            }

            return (
              <ComboboxItem
                key={value}
                value={value}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${String(virtualRow.start)}px)`,
                }}
              >
                {labelsByValue.get(value) ?? value}
              </ComboboxItem>
            )
          })}
        </div>
      </div>
      <ComboboxEmpty>No assignees found</ComboboxEmpty>
    </ComboboxList>
  )
}
