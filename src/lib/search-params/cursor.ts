export type SortKey = 'updated_desc' | 'updated_asc' | 'created_desc' | 'priority_desc'

export const SORT_KEYS = [
  'updated_desc',
  'updated_asc',
  'created_desc',
  'priority_desc',
] as const satisfies readonly SortKey[]

export const DEFAULT_SORT: SortKey = 'updated_desc'

export function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value)
}

export type Cursor = {
  readonly sortValue: string | number
  readonly id: string
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
      return {
        id: parsed.id,
        sortValue: parsed.sortValue,
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
): Cursor {
  switch (sort) {
    case 'updated_desc':
    case 'updated_asc':
      return { id: row.id, sortValue: row.updatedAt.getTime() }
    case 'created_desc':
      return { id: row.id, sortValue: row.createdAt.getTime() }
    case 'priority_desc':
      return { id: row.id, sortValue: row.priorityRank }
  }
}
