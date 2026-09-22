'use client'

import { ChevronDownIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ActiveFilterChip } from '@/features/requests/components/active-filter-chip'
import { ClearFiltersButton } from '@/features/requests/components/clear-filters-button'
import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { priorityLabel, statusLabel } from '@/features/requests/lib/labels'
import type { AssigneeOption, CategoryOption, FacetCountsDto } from '@/features/requests/types'
import { toRoute } from '@/lib/routes'
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '@/lib/search-params/request-enums'
import type { SearchParams } from '@/lib/search-params/schema'
import { hasActiveFilters } from '@/lib/search-params/schema'

type FilterParam = 'status' | 'category' | 'priority' | 'assignee'

type FilterBarProps = {
  params: SearchParams
  categories: readonly CategoryOption[]
  assignees: readonly AssigneeOption[]
  facets: FacetCountsDto
}

type FilterOption = {
  value: string
  label: string
  count?: number
}

type FilterDropdownProps = {
  label: string
  param: FilterParam
  options: readonly FilterOption[]
  selected: readonly string[]
  searchable?: boolean
  onToggle: (param: FilterParam, value: string) => void
}

function filterTriggerName(label: string, selectedCount: number): string {
  if (selectedCount === 0) return `${label} filter`
  return `${label} filter, ${String(selectedCount)} selected`
}

function FilterDropdown({
  label,
  param,
  options,
  selected,
  searchable = false,
  onToggle,
}: FilterDropdownProps) {
  const [query, setQuery] = useState('')
  const selectedCount = selected.length
  const normalisedQuery = query.trim().toLowerCase()

  const visibleOptions = useMemo(() => {
    if (!searchable || normalisedQuery.length === 0) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalisedQuery))
  }, [normalisedQuery, options, searchable])

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) setQuery('')
      }}
    >
      <PopoverTrigger
        aria-label={filterTriggerName(label, selectedCount)}
        render={
          <Button type="button" variant="outline">
            <span>{label}</span>
            {selectedCount > 0 ? (
              <span className="bg-muted text-foreground rounded-sm px-1.5 text-xs font-medium tabular-nums">
                {selectedCount}
              </span>
            ) : null}
            <ChevronDownIcon aria-hidden="true" className="text-muted-foreground size-3.5" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 gap-1 p-1">
        <p className="text-muted-foreground px-2 py-1 text-xs font-medium">{label}</p>
        {searchable ? (
          <div className="px-1 pb-1">
            <Input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-8"
            />
          </div>
        ) : null}
        {visibleOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-sm">No matches</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto overscroll-contain p-0.5">
            {visibleOptions.map((option) => {
              const checked = selected.includes(option.value)
              const id = `${param}-${option.value}`

              return (
                <li key={option.value}>
                  <div className="hover:bg-accent flex items-center gap-2 rounded-md px-1.5 py-1">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => {
                        onToggle(param, option.value)
                      }}
                    />
                    <Label
                      htmlFor={id}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-normal"
                    >
                      <span className="truncate">{option.label}</span>
                      {option.count !== undefined ? (
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {option.count}
                        </span>
                      ) : null}
                    </Label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function FilterBar({ params, categories, assignees, facets }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, startNavigation } = useDashboardNavigation()

  function toggleFilter(param: FilterParam, value: string) {
    const paramsCopy = new URLSearchParams(searchParams.toString())
    const current = paramsCopy.getAll(param)
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]

    paramsCopy.delete(param)
    for (const entry of next) {
      paramsCopy.append(param, entry)
    }
    paramsCopy.delete('cursor')
    paramsCopy.delete('page')
    paramsCopy.delete('seek')

    startNavigation(() => {
      const query = paramsCopy.toString()
      router.replace(toRoute(query ? `${pathname}?${query}` : pathname), { scroll: false })
    })
  }

  const statusOptions = REQUEST_STATUSES.map((status) => ({
    value: status,
    label: statusLabel(status),
    count: facets.status[status],
  }))

  const categoryOptions = categories.map((category) => ({
    value: category.slug,
    label: category.name,
    count: facets.category[category.id],
  }))

  const priorityOptions = REQUEST_PRIORITIES.map((priority) => ({
    value: priority,
    label: priorityLabel(priority),
    count: facets.priority[priority],
  }))

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned', count: facets.assignee.unassigned },
    ...assignees.map((assignee) => ({
      value: assignee.id,
      label: assignee.name,
      count: facets.assignee[assignee.id],
    })),
  ]

  const activeChips = [
    ...params.status.map((status) => ({
      param: 'status' as const,
      value: status,
      label: statusLabel(status),
    })),
    ...params.category.map((slug) => ({
      param: 'category' as const,
      value: slug,
      label: categories.find((category) => category.slug === slug)?.name ?? slug,
    })),
    ...params.priority.map((priority) => ({
      param: 'priority' as const,
      value: priority,
      label: priorityLabel(priority),
    })),
    ...params.assignee.map((assigneeId) => ({
      param: 'assignee' as const,
      value: assigneeId,
      label:
        assigneeId === 'unassigned'
          ? 'Unassigned'
          : (assignees.find((assignee) => assignee.id === assigneeId)?.name ?? assigneeId),
    })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={isPending}>
      <FilterDropdown
        label="Status"
        param="status"
        options={statusOptions}
        selected={params.status}
        onToggle={toggleFilter}
      />
      <FilterDropdown
        label="Category"
        param="category"
        options={categoryOptions}
        selected={params.category}
        onToggle={toggleFilter}
      />
      <FilterDropdown
        label="Priority"
        param="priority"
        options={priorityOptions}
        selected={params.priority}
        onToggle={toggleFilter}
      />
      <FilterDropdown
        label="Assignee"
        param="assignee"
        options={assigneeOptions}
        selected={params.assignee}
        searchable
        onToggle={toggleFilter}
      />
      {hasActiveFilters(params) ? <ClearFiltersButton /> : null}
      {activeChips.length > 0 ? (
        <div className="flex w-full flex-wrap gap-2">
          {activeChips.map((chip) => (
            <ActiveFilterChip
              key={`${chip.param}-${chip.value}`}
              param={chip.param}
              value={chip.value}
              label={chip.label}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
