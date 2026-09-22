export type SortKey =
  'updated_desc' | 'updated_asc' | 'created_desc' | 'priority_desc' | 'priority_asc'

export type CursorDirection = 'next' | 'prev'

export const SORT_KEYS = [
  'updated_desc',
  'updated_asc',
  'created_desc',
  'priority_desc',
  'priority_asc',
] as const satisfies readonly SortKey[]

export const DEFAULT_SORT: SortKey = 'updated_desc'

export function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value)
}

export type Cursor = {
  readonly sortValue: string | number
  readonly id: string
  readonly direction: CursorDirection
}

export function encodeCursor(cursor: Cursor): string {
  const payload = JSON.stringify(cursor)
  return Buffer.from(payload, 'utf8').toString('base64url')
}

export function decodeCursor(token: string): Cursor | null {
  try {
    const payload = Buffer.from(token, 'base64url').toString('utf8')
    const parsed: unknown = JSON.parse(payload)

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      typeof parsed.id === 'string' &&
      'sortValue' in parsed &&
      (typeof parsed.sortValue === 'string' || typeof parsed.sortValue === 'number')
    ) {
      const direction =
        'direction' in parsed && (parsed.direction === 'next' || parsed.direction === 'prev')
          ? parsed.direction
          : 'direction' in parsed
            ? null
            : 'next'

      if (!direction) {
        return null
      }

      return {
        id: parsed.id,
        sortValue: parsed.sortValue,
        direction,
      }
    }

    return null
  } catch {
    return null
  }
}

export function cursorFromRow(
  sort: SortKey,
  row: { id: string; updatedAt: Date; createdAt: Date; priorityRank: number },
  direction: CursorDirection = 'next',
): Cursor {
  switch (sort) {
    case 'updated_desc':
    case 'updated_asc':
      return { id: row.id, sortValue: row.updatedAt.getTime(), direction }
    case 'created_desc':
      return { id: row.id, sortValue: row.createdAt.getTime(), direction }
    case 'priority_desc':
    case 'priority_asc':
      return { id: row.id, sortValue: row.priorityRank, direction }
  }
}
