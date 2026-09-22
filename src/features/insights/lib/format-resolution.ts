function formatDuration(value: number, singular: string, plural: string): string {
  const formatted = value.toFixed(1)
  const amount = Number(formatted)
  return `${formatted} ${amount === 1 ? singular : plural}`
}

export function formatResolutionTime(ms: number | null): string {
  if (ms === null) {
    return '—'
  }

  const hours = ms / 3_600_000
  if (hours < 24) {
    return formatDuration(hours, 'hour', 'hours')
  }

  const days = hours / 24
  return formatDuration(days, 'day', 'days')
}

export function formatResolutionRate(rate: number): string {
  return `${String(Math.round(rate * 100))}%`
}
