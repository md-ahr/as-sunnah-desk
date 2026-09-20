'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'

type MutationVersionApi = {
  readonly requestId: string
  getVersion: () => number
  setVersion: (next: number) => void
}

const MutationVersionContext = createContext<MutationVersionApi | null>(null)

function useLocalMutationVersion(requestId: string, version: number): MutationVersionApi {
  const requestIdRef = useRef(requestId)
  const versionRef = useRef(version)

  useEffect(() => {
    if (requestIdRef.current !== requestId) {
      requestIdRef.current = requestId
      versionRef.current = version
      return
    }

    if (version > versionRef.current) {
      versionRef.current = version
    }
  }, [requestId, version])

  return useMemo(
    () => ({
      requestId,
      getVersion: () => versionRef.current,
      setVersion: (next: number) => {
        versionRef.current = next
      },
    }),
    [requestId],
  )
}

export function RequestMutationVersionProvider({
  requestId,
  version,
  children,
}: {
  requestId: string
  version: number
  children: ReactNode
}) {
  const api = useLocalMutationVersion(requestId, version)

  return <MutationVersionContext.Provider value={api}>{children}</MutationVersionContext.Provider>
}

export function useMutationVersion(requestId: string, version: number) {
  const shared = useContext(MutationVersionContext)

  const local = useLocalMutationVersion(requestId, version)

  if (shared?.requestId === requestId) {
    return { getVersion: shared.getVersion, setVersion: shared.setVersion }
  }

  return { getVersion: local.getVersion, setVersion: local.setVersion }
}
