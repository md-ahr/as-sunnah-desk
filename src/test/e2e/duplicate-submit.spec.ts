import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000904'

test.describe('duplicate submit', () => {
  test('creates exactly one activity entry on rapid double submit', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${MUTATION_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Activity' })).toBeVisible()

    const statusTrigger = page.getByRole('button', { name: /Change status, currently/i })
    await expect(statusTrigger).toBeVisible()

    const before = await page.getByTestId('activity-entry').count()

    await statusTrigger.click()
    const item = page.getByRole('menuitem').first()
    await expect(item).toBeVisible()

    await item.evaluate((element) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    await expect(page.getByTestId('activity-entry')).toHaveCount(before + 1)
  })
})
