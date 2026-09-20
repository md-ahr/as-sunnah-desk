import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

test.describe('insights', () => {
  test('renders per-assignee summary rows and toggles rejected-records disclosure', async ({
    page,
  }) => {
    await signInAsAdmin(page)
    await page.goto('/insights')

    await expect(page.getByRole('heading', { level: 1, name: 'Assignee performance' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Assignee' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Resolved' })).toBeVisible()

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)

    const trigger = page.getByTestId('rejected-records-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()

    const content = page.getByTestId('rejected-records-content')
    await expect(content).toBeVisible()
    await expect(content.getByText('Missing assignee', { exact: true })).toBeVisible()
  })
})
