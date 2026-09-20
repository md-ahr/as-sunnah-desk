export const CATEGORY_SLUGS = [
  'it-support',
  'facilities',
  'hr',
  'finance',
  'procurement',
  'events',
  'communications',
  'maintenance',
  'security',
  'transport',
  'legal',
  'general',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value)
}
