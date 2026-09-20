import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'
import { waitForDashboardClients } from './helpers/dashboard'

test.describe('pagination', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('navigates forward and back without duplicate rows', async ({ page }) => {
    const firstPageReferences = await page.locator('.request-table tbody tr th').allTextContents()

    await page.getByRole('link', { name: 'Next' }).click()
    await expect(page).toHaveURL(/page=2|cursor=/)

    const secondPageReferences = await page.locator('.request-table tbody tr th').allTextContents()
    expect(secondPageReferences.some((reference) => firstPageReferences.includes(reference))).toBe(
      false,
    )

    await page.getByRole('link', { name: 'Previous' }).click()
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page).not.toHaveURL(/cursor=/)
  })

  test('changes page size and resets to the first page', async ({ page }) => {
    await page.goto('/requests?page=2')
    await waitForDashboardClients(page)
    await page.getByRole('link', { name: '25', exact: true }).click()

    await expect(page).toHaveURL(/perPage=25/)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.locator('.request-table tbody tr')).toHaveCount(25)
  })
})
