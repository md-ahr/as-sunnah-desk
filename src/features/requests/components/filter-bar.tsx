'use client'

import { Filter } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ActiveFilterChip } from '@/features/requests/components/active-filter-chip'
import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { toRoute } from '@/lib/routes'
import { ClearFiltersButton } from '@/features/requests/components/clear-filters-button'
import { priorityLabel, statusLabel } from '@/features/requests/lib/labels'
import type { SearchParams } from '@/lib/search-params/schema'
import { hasActiveFilters } from '@/lib/search-params/schema'
import type { AssigneeOption, CategoryOption, FacetCountsDto } from '@/features/requests/types'
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '@/lib/search-params/request-enums'

type FilterBarProps = {
  params: SearchParams
  categories: readonly CategoryOption[]
  assignees: readonly AssigneeOption[]
  facets: FacetCountsDto
}

type FilterGroupProps = {
  title: string
  param: 'status' | 'priority' | 'category' | 'assignee'
  options: { value: string; label: string; count?: number }[]
  selected: readonly string[]
  onToggle: (param: FilterGroupProps['param'], value: string) => void
}

function FilterGroup({ title, param, options, selected, onToggle }: FilterGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      <ul className="space-y-2">
        {options.map((option) => {
          const checked = selected.includes(option.value)
          const id = `${param}-${option.value}`

          return (
            <li key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => {
                  onToggle(param, option.value)
                }}
              />
              <Label htmlFor={id} className="flex flex-1 items-center justify-between gap-2 text-sm">
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                )}
              </Label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

function FilterControls({
  params,
  categories,
  assignees,
  facets,
  onToggle,
}: FilterBarProps & {
  onToggle: (param: 'status' | 'priority' | 'category' | 'assignee', value: string) => void
}) {
  const statusOptions = REQUEST_STATUSES.map((status) => ({
    value: status,
    label: statusLabel(status),
    count: facets.status[status],
  }))

  const priorityOptions = REQUEST_PRIORITIES.map((priority) => ({
    value: priority,
    label: priorityLabel(priority),
    count: facets.priority[priority],
  }))

  const categoryOptions = categories.map((category) => ({
    value: category.slug,
    label: category.name,
    count: facets.category[category.id],
  }))

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned', count: facets.assignee.unassigned },
    ...assignees.map((assignee) => ({
      value: assignee.id,
      label: assignee.name,
      count: facets.assignee[assignee.id],
    })),
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FilterGroup
        title="Status"
        param="status"
        options={statusOptions}
        selected={params.status}
        onToggle={onToggle}
      />
      <FilterGroup
        title="Priority"
        param="priority"
        options={priorityOptions}
        selected={params.priority}
        onToggle={onToggle}
      />
      <FilterGroup
        title="Category"
        param="category"
        options={categoryOptions}
        selected={params.category}
        onToggle={onToggle}
      />
      <FilterGroup
        title="Assignee"
        param="assignee"
        options={assigneeOptions}
        selected={params.assignee}
        onToggle={onToggle}
      />
    </div>
  )
}

export function FilterBar({ params, categories, assignees, facets }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, startNavigation } = useDashboardNavigation()

  function toggleFilter(param: 'status' | 'priority' | 'category' | 'assignee', value: string) {
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

    startNavigation(() => {
      const query = paramsCopy.toString()
      router.replace(toRoute(query ? `${pathname}?${query}` : pathname), { scroll: false })
    })
  }

  const activeChips = [
    ...params.status.map((status) => ({
      param: 'status' as const,
      value: status,
      label: statusLabel(status),
    })),
    ...params.priority.map((priority) => ({
      param: 'priority' as const,
      value: priority,
      label: priorityLabel(priority),
    })),
    ...params.category.map((slug) => ({
      param: 'category' as const,
      value: slug,
      label: categories.find((category) => category.slug === slug)?.name ?? slug,
    })),
    ...params.assignee.map((assigneeId) => ({
      param: 'assignee' as const,
      value: assigneeId,
      label:
        assigneeId === 'unassigned'
          ? 'Unassigned'
          : assignees.find((assignee) => assignee.id === assigneeId)?.name ?? assigneeId,
    })),
  ]

  const controls = (
    <FilterControls
      params={params}
      categories={categories}
      assignees={assignees}
      facets={facets}
      onToggle={toggleFilter}
    />
  )

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden md:block">
          <Popover>
            <PopoverTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  <Filter className="size-4" aria-hidden="true" />
                  Filters
                </Button>
              }
            />
            <PopoverContent className="w-[min(100vw-2rem,42rem)] p-4">{controls}</PopoverContent>
          </Popover>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button type="button" variant="outline" size="sm" className="md:hidden">
                <Filter className="size-4" aria-hidden="true" />
                Filters
              </Button>
            }
          />
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">{controls}</div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters(params) && <ClearFiltersButton />}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <ActiveFilterChip
              key={`${chip.param}-${chip.value}`}
              param={chip.param}
              value={chip.value}
              label={chip.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}
