import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

test.describe('filters', () => {
  test('composes filters in the URL and reproduces the view in a fresh context', async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page)

    const filteredUrl =
      '/requests?status=new&status=in_progress&priority=urgent&category=it-support'
    await page.goto(filteredUrl)

    await expect(page).toHaveURL(/status=new/)
    await expect(page).toHaveURL(/priority=urgent/)
    await expect(page).toHaveURL(/category=it-support/)

    const freshContext = await browser.newContext()
    const freshPage = await freshContext.newPage()

    await signInAsAdmin(freshPage)
    await freshPage.goto(filteredUrl)

    await expect(freshPage).toHaveURL(/status=new/)
    await expect(freshPage).toHaveURL(/priority=urgent/)
    await expect(freshPage.locator('.request-table tbody tr').first()).toBeVisible()

    await freshContext.close()
  })
})
