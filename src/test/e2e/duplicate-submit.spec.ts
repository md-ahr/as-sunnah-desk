import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000904'

test.describe('duplicate submit', () => {
  test('creates exactly one activity entry on rapid double submit', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${MUTATION_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const before = await page.getByTestId('activity-entry').count()
    await page.getByTestId('status-badge').click()
    const item = page.getByRole('menuitem', { name: 'In review' })
    await Promise.all([item.click(), item.click().catch(() => undefined)])

    await expect(page.getByTestId('activity-entry')).toHaveCount(before + 1)
  })
})
