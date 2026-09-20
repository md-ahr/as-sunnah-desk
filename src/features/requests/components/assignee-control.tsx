'use client'

import { useMemo, useOptimistic, useRef, useTransition } from 'react'
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
import { messageFor, successMessageForAssignee } from '@/features/requests/lib/messages'
import type { AssigneeOption } from '@/features/requests/types'
import { cn } from '@/lib/utils'

const UNASSIGNED_VALUE = '__unassigned__'

type AssigneeItem = {
  readonly id: string
  readonly name: string
}

type AssigneeControlProps = {
  requestId: string
  assignee: AssigneeOption | null
  version: number
  canEdit: boolean
  options: readonly AssigneeOption[]
  disabledReason?: string
}

export function AssigneeControl({
  requestId,
  assignee,
  version,
  canEdit,
  options,
  disabledReason = 'You do not have permission to change the assignee.',
}: AssigneeControlProps) {
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic(assignee)
  const [isPending, startTransition] = useTransition()
  const anchorRef = useComboboxAnchor()

  const items = useMemo<AssigneeItem[]>(
    () => [{ id: UNASSIGNED_VALUE, name: 'Unassigned' }, ...options],
    [options],
  )

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

    startTransition(async () => {
      setOptimisticAssignee(nextAssignee)

      const result = await updateAssignee({
        id: requestId,
        assigneeId: nextAssigneeId,
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

      toast.success(successMessageForAssignee(result.data.assignee?.name ?? null))
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
    <div ref={anchorRef} className="max-w-xs">
      <Combobox
        value={selectedValue}
        onValueChange={onValueChange}
        disabled={isPending}
        items={items}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.id}
      >
        <ComboboxInput
          aria-label="Assignee"
          placeholder={selectedLabel}
          showClear={false}
          className="w-full"
        />
        <ComboboxContent anchor={anchorRef}>
          <VirtualizedAssigneeList items={items} />
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function VirtualizedAssigneeList({ items }: { items: readonly AssigneeItem[] }) {
  const listRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
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
            const item = items[virtualRow.index]
            if (!item) {
              return null
            }

            return (
              <ComboboxItem
                key={item.id}
                value={item}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${String(virtualRow.start)}px)`,
                }}
              >
                {item.name}
              </ComboboxItem>
            )
          })}
        </div>
      </div>
      <ComboboxEmpty>No assignees found</ComboboxEmpty>
    </ComboboxList>
  )
}
