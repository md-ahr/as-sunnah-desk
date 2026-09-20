import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000902'

test.describe('update failure rollback', () => {
  test('rolls back optimistic status when the action fails', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto(`/requests/${MUTATION_REFERENCE}`)
    await expect(page.getByTestId('status-badge')).toBeVisible()

    const initialStatus = (await page.getByTestId('status-badge').innerText()).trim()

    await page.route('**/*', async (route) => {
      const request = route.request()
      if (request.method() === 'POST') {
        await route.abort('failed')
        return
      }

      await route.continue()
    })

    await page.getByTestId('status-badge').click()
    const nextOption = page.getByRole('menuitem').first()
    const nextLabel = (await nextOption.innerText()).trim()
    await nextOption.click()

    await expect(page.getByTestId('status-badge')).toHaveText(nextLabel)
    await expect(page.getByTestId('status-badge')).toHaveText(initialStatus, { timeout: 10_000 })
    await expect(page.getByText('The status update could not be completed.')).toBeVisible()
  })
})
