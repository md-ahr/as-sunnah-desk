import type { ReactNode } from 'react'

import type { SearchParams } from '@/lib/search-params/schema'

export function searchParamHiddenFields(
  params: SearchParams,
  omit: Partial<Record<keyof SearchParams, boolean>> = {},
): ReactNode {
  const fields: ReactNode[] = []

  if (params.q && !omit.q) {
    fields.push(<input key="q" type="hidden" name="q" value={params.q} />)
  }

  if (!omit.status) {
    for (const status of params.status) {
      fields.push(<input key={`status-${status}`} type="hidden" name="status" value={status} />)
    }
  }

  if (!omit.priority) {
    for (const priority of params.priority) {
      fields.push(
        <input key={`priority-${priority}`} type="hidden" name="priority" value={priority} />,
      )
    }
  }

  if (!omit.category) {
    for (const category of params.category) {
      fields.push(
        <input key={`category-${category}`} type="hidden" name="category" value={category} />,
      )
    }
  }

  if (!omit.assignee) {
    for (const assignee of params.assignee) {
      fields.push(
        <input key={`assignee-${assignee}`} type="hidden" name="assignee" value={assignee} />,
      )
    }
  }

  if (params.sort !== 'updated_desc' && !omit.sort) {
    fields.push(<input key="sort" type="hidden" name="sort" value={params.sort} />)
  }

  if (params.cursor && !omit.cursor) {
    fields.push(<input key="cursor" type="hidden" name="cursor" value={params.cursor} />)
  }

  if (params.seek === 'end' && !omit.seek) {
    fields.push(<input key="seek" type="hidden" name="seek" value="end" />)
  }

  if (params.page > 1 && !omit.page) {
    fields.push(<input key="page" type="hidden" name="page" value={String(params.page)} />)
  }

  if (params.perPage !== 10 && !omit.perPage) {
    fields.push(<input key="perPage" type="hidden" name="perPage" value={String(params.perPage)} />)
  }

  return fields
}
