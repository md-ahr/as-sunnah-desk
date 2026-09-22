'use client'

import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useDashboardNavigation } from '@/features/requests/components/dashboard-navigation'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'
import { toRoute } from '@/lib/routes'
import { searchParamHiddenFields } from '@/lib/search-params/form-fields'
import type { SearchParams } from '@/lib/search-params/schema'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  params: SearchParams
}

export function SearchInput({ params }: SearchInputProps) {
  const [value, setValue] = useState(params.q ?? '')
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, startNavigation } = useDashboardNavigation()

  const commit = useDebouncedCallback((next: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (next) {
      nextParams.set('q', next)
    } else {
      nextParams.delete('q')
    }

    nextParams.delete('cursor')
    nextParams.delete('page')
    nextParams.delete('seek')

    startNavigation(() => {
      const query = nextParams.toString()
      router.replace(toRoute(query ? `${pathname}?${query}` : pathname), { scroll: false })
    })
  }, 300)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target
      const inEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')

      if (event.key === '/' && !inEditable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        inputRef.current?.focus()
        return
      }

      if (event.key === 'Escape' && target === inputRef.current) {
        setValue('')
        commit('')
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [commit])

  return (
    <form
      ref={formRef}
      method="get"
      action="/requests"
      className="relative w-full max-w-md basis-full sm:basis-auto"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      {searchParamHiddenFields(params, { q: true, cursor: true, page: true, seek: true })}
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          commit(event.target.value)
        }}
        aria-label="Search requests"
        aria-describedby="search-hint"
        placeholder="Search by reference or subject"
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm',
        )}
      />
      {isPending && (
        <Loader2
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
        />
      )}
      <p id="search-hint" className="sr-only">
        Searches request reference, subject and description.
      </p>
    </form>
  )
}
