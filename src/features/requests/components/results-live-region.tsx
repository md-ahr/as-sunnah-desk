'use client'

type ResultsLiveRegionProps = {
  total: number
  isPending?: boolean
}

export function ResultsLiveRegion({ total, isPending = false }: ResultsLiveRegionProps) {
  const message = isPending ? 'Loading results' : `${String(total)} requests found`

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
