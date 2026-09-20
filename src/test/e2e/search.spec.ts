import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'
import { waitForDashboardClients } from './helpers/dashboard'

test.describe('search', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('debounces search into the URL and clears pagination state', async ({ page }) => {
    await page.goto('/requests?page=2')
    await waitForDashboardClients(page)

    const search = page.getByLabel('Search requests')
    await search.click()
    await search.pressSequentially('SR-2026', { delay: 50 })

    await expect(page).toHaveURL(/q=SR-2026/, { timeout: 10_000 })
    await expect(page).not.toHaveURL(/page=/)
    await expect(page).not.toHaveURL(/cursor=/)
  })
})
