'use client'

type ResultsLiveRegionProps = {
  total: number | `${number}+`
  isPending?: boolean
}

export function ResultsLiveRegion({ total, isPending = false }: ResultsLiveRegionProps) {
  const message = isPending
    ? 'Loading results'
    : `${typeof total === 'number' ? String(total) : total} requests found`

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
