import { expect, test } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

import { signInAsAdmin } from './helpers/auth'

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('renders all required columns and ten rows by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Service requests' })).toBeVisible()

    for (const column of [
      'ID',
      'Subject',
      'Requester',
      'Category',
      'Priority',
      'Status',
      'Assignee',
      'Last updated',
    ]) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }

    await expect(page.locator('.request-table tbody tr')).toHaveCount(10)
  })

  test('passes axe on initial load', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Service requests' })).toBeVisible()
    await expect(page).toHaveTitle(/Service requests/)
    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
    expect(results.violations).toEqual([])
  })
})
