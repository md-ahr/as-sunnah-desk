import Link from 'next/link'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toRoute } from '@/lib/routes'
import { PriorityBadge } from '@/features/requests/components/priority-badge'
import { RequestDetailLink } from '@/features/requests/components/request-detail-link'
import { RowStatusControl } from '@/features/requests/components/row-status-control'
import { formatAbsoluteTime, formatRelativeTime, initials } from '@/features/requests/lib/labels'
import type { RequestListItemDto } from '@/features/requests/types'

type RequestRowProps = {
  row: RequestListItemDto
  canEditStatus: boolean
  now: number
}

export function RequestRow({ row, canEditStatus, now }: RequestRowProps) {
  const updatedLabel = formatRelativeTime(row.updatedAt, now)
  const updatedAbsolute = formatAbsoluteTime(row.updatedAt)
  const detailHref = toRoute(`/requests/${row.reference}`)

  return (
    <tr className="request-table-row border-border hover:bg-muted/50 border-b align-middle last:border-b-0">
      <th
        scope="row"
        className="overflow-hidden px-4 py-3 text-left align-middle font-medium"
        data-label="ID"
      >
        <span className="text-foreground font-mono text-xs tabular-nums">{row.reference}</span>
      </th>
      <td className="overflow-hidden px-4 py-3 align-middle" data-label="Subject">
        <Link
          href={detailHref}
          prefetch={true}
          className="text-primary block truncate text-sm font-medium hover:underline"
          title={row.subject}
        >
          {row.subject}
        </Link>
      </td>
      <td className="overflow-hidden px-4 py-3 align-middle" data-label="Requester">
        <div className="flex items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-[10px]">{initials(row.requester.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.requester.name}</p>
            <p className="text-muted-foreground truncate text-xs">{row.requester.email}</p>
          </div>
        </div>
      </td>
      <td
        className="overflow-hidden px-4 py-3 align-middle text-sm whitespace-nowrap"
        data-label="Category"
      >
        {row.category.name}
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap" data-label="Priority">
        <div className="request-table-inline-value">
          <PriorityBadge priority={row.priority} />
        </div>
      </td>
      <td className="px-4 py-3 align-middle whitespace-nowrap" data-label="Status">
        <div className="request-table-inline-value">
          <RowStatusControl
            requestId={row.id}
            status={row.status}
            version={row.version}
            canEdit={canEditStatus}
          />
        </div>
      </td>
      <td
        className="overflow-hidden px-4 py-3 align-middle text-sm whitespace-nowrap"
        data-label="Assignee"
      >
        <span className={row.assignee ? 'block truncate' : 'text-muted-foreground block truncate'}>
          {row.assignee?.name ?? 'Unassigned'}
        </span>
      </td>
      <td
        className="text-muted-foreground px-4 py-3 align-middle text-sm whitespace-nowrap tabular-nums"
        data-label="Last updated"
      >
        <time dateTime={row.updatedAt.toISOString()} title={updatedAbsolute}>
          {updatedLabel}
        </time>
      </td>
      <td className="px-2 py-3 text-right align-middle whitespace-nowrap" data-label="View">
        <RequestDetailLink reference={row.reference} subject={row.subject} />
      </td>
    </tr>
  )
}
