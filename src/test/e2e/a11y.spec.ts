import { expect, test } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

import { ADMIN_ACCOUNT, signInAsAdmin } from './helpers/auth'
import { waitForDashboardClients } from './helpers/dashboard'
import { waitForInsights } from './helpers/insights'

const KEYBOARD_STATUS_REFERENCE = 'SR-2026-000908'

test.describe('accessibility', () => {
  test('passes axe on the login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
    expect(results.violations).toEqual([])
  })

  test('passes axe on the insights page', async ({ page }) => {
    await page.goto('/login?next=/insights')
    await page.getByLabel('Email', { exact: true }).fill(ADMIN_ACCOUNT.email)
    await page.getByLabel('Password', { exact: true }).fill(ADMIN_ACCOUNT.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Assignee performance' }),
    ).toBeVisible()
    await waitForInsights(page)

    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
    expect(results.violations).toEqual([])
  })

  test('shows the root not-found page for unknown routes', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/this-route-does-not-exist')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to dashboard' })).toBeVisible()
  })

  test('completes login, search, open request, and change status using keyboard only', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login?next=/requests')

    const email = page.getByLabel('Email', { exact: true })
    const password = page.getByLabel('Password', { exact: true })
    const submit = page.getByRole('button', { name: 'Sign in' })

    await expect(email).toBeVisible()
    await email.focus()
    await expect(email).toBeFocused()
    await email.pressSequentially(ADMIN_ACCOUNT.email)
    await page.keyboard.press('Tab')
    await expect(password).toBeFocused()
    await password.pressSequentially(ADMIN_ACCOUNT.password)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(submit).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/requests')
    await expect(page.getByRole('heading', { name: 'Service requests' })).toBeVisible()
    await waitForDashboardClients(page)

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const focused = await page
        .getByLabel('Search requests')
        .evaluate((element) => element === document.activeElement)
      if (focused) break
      await page.keyboard.press('Tab')
    }
    await expect(page.getByLabel('Search requests')).toBeFocused()

    await page.keyboard.insertText(KEYBOARD_STATUS_REFERENCE)
    const row = page.locator('.request-table tbody tr').filter({
      hasText: KEYBOARD_STATUS_REFERENCE,
    })
    await expect(row).toBeVisible()

    const detailLink = row.getByRole('link', { name: /View details for/ })
    await detailLink.focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(`/requests/${KEYBOARD_STATUS_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const statusTrigger = page.getByRole('button', { name: /Change status, currently/ })
    await statusTrigger.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'In review' }).focus()
    await page.keyboard.press('Enter')

    await expect(page.getByText('Status changed to In review')).toBeVisible()
  })
})
