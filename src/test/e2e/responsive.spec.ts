import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'
import { waitForDashboardClients } from './helpers/dashboard'

const ALL_COLUMNS = [
  'ID',
  'Subject',
  'Requester',
  'Category',
  'Priority',
  'Status',
  'Assignee',
  'Last updated',
]

const TABLET_HIDDEN_COLUMNS = ['Requester', 'Category', 'Assignee']

test.describe('responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('uses card layout on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await waitForDashboardClients(page)

    const table = page.getByRole('table', { name: /Service requests, sorted/ })
    await expect(table).toBeVisible()
    await expect(table.locator('thead')).toBeHidden()
    await expect(table.locator('.request-table-row').first()).toBeVisible()
    await expect(table.locator('[data-label="Requester"]').first()).toBeHidden()
  })

  test('hides lower-priority columns on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page.getByRole('columnheader', { name: 'Subject' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()

    for (const column of TABLET_HIDDEN_COLUMNS) {
      await expect(page.getByRole('columnheader', { name: column })).toBeHidden()
    }
  })

  test('shows all columns on desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    for (const column of ALL_COLUMNS) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }
  })
})
