'use client'

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react'
import type { ReactNode } from 'react'

type DashboardNavigationContextValue = {
  readonly isPending: boolean
  readonly startNavigation: (fn: () => void) => void
}

const DashboardNavigationContext = createContext<DashboardNavigationContextValue | null>(null)

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition()

  const startNavigation = useCallback((fn: () => void) => {
    startTransition(fn)
  }, [])

  const value = useMemo(
    () => ({
      isPending,
      startNavigation,
    }),
    [isPending, startNavigation],
  )

  return (
    <DashboardNavigationContext.Provider value={value}>
      {children}
    </DashboardNavigationContext.Provider>
  )
}

export function useDashboardNavigation(): DashboardNavigationContextValue {
  const context = useContext(DashboardNavigationContext)
  const [localPending, startLocalTransition] = useTransition()

  const startNavigation = useCallback((fn: () => void) => {
    startLocalTransition(fn)
  }, [])

  if (context) {
    return context
  }

  return {
    isPending: localPending,
    startNavigation,
  }
}

export function RefiningResultsShell({ children }: { children: ReactNode }) {
  const { isPending } = useDashboardNavigation()

  return (
    <div
      className={isPending ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6'}
      aria-busy={isPending || undefined}
    >
      {children}
    </div>
  )
}
