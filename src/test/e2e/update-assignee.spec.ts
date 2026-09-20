import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000901'
const KEYBOARD_REFERENCE = 'SR-2026-000907'

test.describe('update assignee', () => {
  test('assigns from the detail page and records activity', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${MUTATION_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const before = await page.getByTestId('activity-entry').count()
    await page.getByRole('combobox', { name: 'Assignee' }).click()
    await page.getByRole('option', { name: 'Admin User' }).click()

    await expect(page.getByText('Assigned to Admin User')).toBeVisible()
    await expect(page.getByTestId('activity-entry')).toHaveCount(before + 1)
  })

  test('assigns with combobox keyboard navigation', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${KEYBOARD_REFERENCE}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const combobox = page.getByRole('combobox', { name: 'Assignee' })
    await combobox.click()
    await combobox.pressSequentially('Admin User')
    const option = page.getByRole('option', { name: 'Admin User' })
    await expect(option).toBeVisible()
    await option.click()

    await expect(page.getByText('Assigned to Admin User')).toBeVisible()
  })
})
