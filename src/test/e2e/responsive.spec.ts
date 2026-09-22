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

test.describe('responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('uses card layout below 768px and shows key fields on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await waitForDashboardClients(page)

    const table = page.getByRole('table', { name: /Service requests, sorted/ })
    await expect(table).toBeVisible()
    await expect(table.locator('thead')).toBeHidden()
    await expect(table.locator('.request-table-row').first()).toBeVisible()

    for (const label of ['Requester', 'Category', 'Assignee']) {
      await expect(table.locator(`[data-label="${label}"]`).first()).toBeVisible()
    }
  })

  test('uses card layout at 767px', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 1024 })
    await waitForDashboardClients(page)

    const table = page.getByRole('table', { name: /Service requests, sorted/ })
    await expect(table.locator('thead')).toBeHidden()
    await expect(table.locator('.request-table-row').first()).toBeVisible()
  })

  test('shows all columns on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await waitForDashboardClients(page)

    for (const column of ALL_COLUMNS) {
      const header = page.getByRole('columnheader', { name: column })
      await header.scrollIntoViewIfNeeded()
      await expect(header).toBeVisible()
    }
  })

  test('shows all columns on desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    for (const column of ALL_COLUMNS) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }
  })
})
