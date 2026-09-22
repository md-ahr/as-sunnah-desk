import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'
import { waitForDashboardClients } from './helpers/dashboard'

test.describe('pagination', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('navigates forward and back without duplicate rows', async ({ page }) => {
    await waitForDashboardClients(page)
    await expect(page.locator('.request-table tbody tr')).toHaveCount(10)

    const firstPageReferences = await page.locator('.request-table tbody tr th').allTextContents()

    await page.getByRole('link', { name: 'Next page' }).click()
    await expect(page).toHaveURL(/page=2|cursor=/)

    const secondPageReferences = await page.locator('.request-table tbody tr th').allTextContents()
    expect(secondPageReferences.some((reference) => firstPageReferences.includes(reference))).toBe(
      false,
    )

    await page.getByRole('link', { name: 'Next page' }).click()
    await expect(page.locator('.request-table tbody tr').first()).toBeVisible()

    await page.getByRole('link', { name: 'Previous page' }).click()
    await expect(page.locator('.request-table tbody tr th')).toHaveText(secondPageReferences)

    await page.getByRole('link', { name: 'Previous page' }).click()
    await expect(page.locator('.request-table tbody tr th')).toHaveText(firstPageReferences)
  })

  test('opens the page after the offset window and the last page', async ({ page }) => {
    await page.goto('/requests?page=20')
    await waitForDashboardClients(page)

    await page.getByRole('link', { name: 'Page 21' }).click()
    await expect(page).toHaveURL(/cursor=/)
    await expect(page).toHaveURL(/page=21/)
    await expect(page.locator('nav[aria-label="Pagination"] [aria-current="page"]')).toHaveText(
      '21',
    )

    await page.getByRole('link', { name: /Page 1,200|Page 1200/ }).click()
    await expect(page).toHaveURL(/seek=end/)
    await expect(page).toHaveURL(/page=1200/)
    await expect(page.locator('nav[aria-label="Pagination"] [aria-current="page"]')).toHaveText(
      /1,200|1200/,
    )
    await expect(page.getByText(/Showing 11,991–12,000|Showing 11991–12000/)).toBeVisible()

    await page.getByRole('link', { name: 'Previous page' }).click()
    await expect(page).toHaveURL(/cursor=/)
    await expect(page).toHaveURL(/page=1199/)
    await expect(page).not.toHaveURL(/seek=end/)
    await expect(page.locator('nav[aria-label="Pagination"] [aria-current="page"]')).toHaveText(
      /1,199|1199/,
    )
  })

  test('changes page size and resets to the first page', async ({ page }) => {
    await page.goto('/requests?page=2')
    await waitForDashboardClients(page)
    await page.getByRole('combobox', { name: 'Items per page' }).click()
    await page.getByRole('option', { name: '25', exact: true }).click()

    await expect(page).toHaveURL(/perPage=25/)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.locator('.request-table tbody tr')).toHaveCount(25)
  })
})
