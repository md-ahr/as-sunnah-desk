import type { SortKey } from '@/lib/search-params/cursor'

export type RequestColumnId =
  | 'reference'
  | 'subject'
  | 'requester'
  | 'category'
  | 'priority'
  | 'status'
  | 'assignee'
  | 'updatedAt'

export type RequestColumn = {
  readonly id: RequestColumnId
  readonly label: string
  readonly sortKey?: SortKey
}

export const REQUEST_COLUMNS: readonly RequestColumn[] = [
  { id: 'reference', label: 'ID' },
  { id: 'subject', label: 'Subject' },
  { id: 'requester', label: 'Requester' },
  { id: 'category', label: 'Category' },
  { id: 'priority', label: 'Priority', sortKey: 'priority_desc' },
  { id: 'status', label: 'Status' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'updatedAt', label: 'Last updated', sortKey: 'updated_desc' },
]

export function ariaSortForColumn(
  column: RequestColumn,
  currentSort: SortKey,
): 'ascending' | 'descending' | 'none' {
  if (!column.sortKey) return 'none'
  if (column.sortKey === currentSort) {
    return currentSort.endsWith('_asc') ? 'ascending' : 'descending'
  }
  return 'none'
}
