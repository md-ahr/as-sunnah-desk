import { expect, test } from '@playwright/test'

import { ADMIN_ACCOUNT } from './helpers/auth'

test.describe('access control', () => {
  test('agent sees only assigned requests in the list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/login?next=/requests')
    await page.getByLabel('Email', { exact: true }).fill('agent@assunnah.test')
    await page.getByLabel('Password', { exact: true }).fill('test.agent')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/requests')

    const rows = page.locator('.request-table tbody tr')
    await expect(rows.first()).toBeVisible()
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)

    for (let index = 0; index < count; index += 1) {
      await expect(rows.nth(index).locator('[data-label="Assignee"]')).toHaveText('Agent User')
    }
  })

  test('viewer sees disabled status controls', async ({ page }) => {
    await page.goto('/login?next=/requests')
    await page.getByLabel('Email', { exact: true }).fill('viewer@assunnah.test')
    await page.getByLabel('Password', { exact: true }).fill('test.viewer')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/requests')

    await expect(page.locator('.request-table tbody tr').first()).toBeVisible()
    await page.getByTestId('status-badge').first().click({ force: true })
    await expect(page.getByRole('menuitem')).toHaveCount(0)

    await page.goto('/requests/SR-2026-000142')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Assignee' })).toHaveCount(0)
    await page.getByTestId('status-badge').click({ force: true })
    await expect(page.getByRole('menuitem')).toHaveCount(0)
  })

  test('admin can update status on any request detail', async ({ page }) => {
    await page.goto('/login?next=/requests')
    await page.getByLabel('Email', { exact: true }).fill(ADMIN_ACCOUNT.email)
    await page.getByLabel('Password', { exact: true }).fill(ADMIN_ACCOUNT.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/requests')

    await page.goto('/requests/SR-2026-000142')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByTestId('status-badge').click()
    await expect(page.getByRole('menuitem').first()).toBeVisible()
  })
})
