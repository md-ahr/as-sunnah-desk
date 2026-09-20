import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000900'
const DASHBOARD_REFERENCE = 'SR-2026-000906'

test.describe('update status', () => {
  test('shows optimistic status, success toast, and activity entry', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${MUTATION_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const before = await page.getByTestId('activity-entry').count()
    await page.getByTestId('status-badge').click()

    await expect(page.getByRole('menuitem', { name: 'In review' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Resolved' })).toHaveCount(0)
    await expect(page.getByRole('menuitem', { name: 'Closed' })).toHaveCount(0)

    await page.getByRole('menuitem', { name: 'In review' }).click()

    await expect(page.getByTestId('status-badge')).toHaveText('In review')
    await expect(page.getByText('Status changed to In review')).toBeVisible()
    await expect(page.getByTestId('activity-entry')).toHaveCount(before + 1)
  })

  test('updates status from a dashboard row', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/requests?q=dashboard+status')

    const row = page.locator('.request-table tbody tr').filter({ hasText: DASHBOARD_REFERENCE })
    await expect(row).toBeVisible()

    await row.getByTestId('status-badge').click()
    await page.getByRole('menuitem', { name: 'In review' }).click()

    await expect(page.getByText('Status changed to In review')).toBeVisible()
    await expect(row.getByTestId('status-badge')).toHaveText('In review')
  })

  test('supports consecutive status updates with fresh versions', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/requests/SR-2026-000905')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByTestId('status-badge').click()
    await page.getByRole('menuitem', { name: 'In review' }).click()
    await expect(page.getByText('Status changed to In review')).toBeVisible()

    await page.getByTestId('status-badge').click()
    await page.getByRole('menuitem', { name: 'In progress' }).click()
    await expect(page.getByText('Status changed to In progress')).toBeVisible()
  })
})
