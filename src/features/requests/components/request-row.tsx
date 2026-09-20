import Link from 'next/link'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toRoute } from '@/lib/routes'
import { PriorityBadge } from '@/features/requests/components/priority-badge'
import { RowStatusControl } from '@/features/requests/components/row-status-control'
import { formatAbsoluteTime, formatRelativeTime, initials } from '@/features/requests/lib/labels'
import { columnMobileHiddenProps, REQUEST_COLUMNS } from '@/features/requests/request-columns'
import type { RequestListItemDto } from '@/features/requests/types'

const MOBILE_HIDDEN = new Map(
  REQUEST_COLUMNS.map((column) => [column.id, columnMobileHiddenProps(column)]),
)

type RequestRowProps = {
  row: RequestListItemDto
  canEditStatus: boolean
  now: number
}

export function RequestRow({ row, canEditStatus, now }: RequestRowProps) {
  const updatedLabel = formatRelativeTime(row.updatedAt, now)
  const updatedAbsolute = formatAbsoluteTime(row.updatedAt)

  return (
    <tr className="request-table-row border-border border-t">
      <th scope="row" className="px-4 py-3 text-left font-medium" data-label="ID">
        <Link href={toRoute(`/requests/${row.reference}`)} className="text-primary hover:underline">
          {row.reference}
        </Link>
      </th>
      <td className="px-4 py-3" data-label="Subject">
        <Link
          href={toRoute(`/requests/${row.reference}`)}
          prefetch={true}
          className="line-clamp-2 hover:underline"
          title={row.subject}
        >
          {row.subject}
        </Link>
      </td>
      <td className="px-4 py-3" data-label="Requester" {...MOBILE_HIDDEN.get('requester')}>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">{initials(row.requester.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.requester.name}</p>
            <p className="text-muted-foreground truncate text-xs">{row.requester.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm" data-label="Category" {...MOBILE_HIDDEN.get('category')}>
        {row.category.name}
      </td>
      <td className="px-4 py-3" data-label="Priority">
        <PriorityBadge priority={row.priority} />
      </td>
      <td className="px-4 py-3" data-label="Status">
        <RowStatusControl
          requestId={row.id}
          status={row.status}
          version={row.version}
          canEdit={canEditStatus}
        />
      </td>
      <td className="px-4 py-3 text-sm" data-label="Assignee" {...MOBILE_HIDDEN.get('assignee')}>
        {row.assignee?.name ?? 'Unassigned'}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap" data-label="Last updated">
        <time dateTime={row.updatedAt.toISOString()} title={updatedAbsolute}>
          {updatedLabel}
        </time>
      </td>
    </tr>
  )
}
