import { expect, test } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

import { signInAsAdmin } from './helpers/auth'

const KNOWN_REFERENCE = 'SR-2026-000142'
const KNOWN_SUBJECT = 'Laptop replacement for new staff member'

test.describe('request detail', () => {
  test('navigates from the dashboard and preserves the view on refresh', async ({ page }) => {
    await signInAsAdmin(page)

    const row = page.locator('.request-table tbody tr').first()
    const subjectLink = row.getByRole('link').first()
    const subject = (await subjectLink.innerText()).trim()
    await row.getByRole('link', { name: /View details for/ }).click()

    await expect(page).toHaveURL(/\/requests\/SR-\d{4}-\d{6}/)
    await expect(page.getByRole('heading', { level: 1, name: subject })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Activity' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('heading', { level: 1, name: subject })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Activity' })).toBeVisible()
  })

  test('loads a request from a cold direct URL', async ({ page }) => {
    await page.goto(`/login?next=/requests/${KNOWN_REFERENCE}`)
    await page.getByLabel('Email', { exact: true }).fill('admin@assunnah.test')
    await page.getByLabel('Password', { exact: true }).fill('test.admin')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(`/requests/${KNOWN_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1, name: KNOWN_SUBJECT })).toBeVisible()
    await expect(page.getByText(KNOWN_REFERENCE, { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Activity' })).toBeVisible()
    await expect(page).toHaveTitle(new RegExp(KNOWN_REFERENCE))
  })

  test('shows not-found for an unknown reference', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/requests/SR-2099-999999')

    await expect(page.getByRole('heading', { name: 'Request not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to all requests' })).toBeVisible()
  })

  test('passes axe on the detail page', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${KNOWN_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1, name: KNOWN_SUBJECT })).toBeVisible()

    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
    expect(results.violations).toEqual([])
  })
})
