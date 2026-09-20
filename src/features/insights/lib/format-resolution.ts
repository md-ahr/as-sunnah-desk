export function formatResolutionTime(ms: number | null): string {
  if (ms === null) {
    return '—'
  }

  const hours = ms / 3_600_000
  if (hours < 24) {
    return `${hours.toFixed(1)} h`
  }

  const days = hours / 24
  return `${days.toFixed(1)} d`
}

export function formatResolutionRate(rate: number): string {
  return `${String(Math.round(rate * 100))}%`
}
