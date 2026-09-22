import { expect, test } from '@playwright/test'

import { signInAsAdmin } from './helpers/auth'

const MUTATION_REFERENCE = 'SR-2026-000903'

test.describe('update conflict', () => {
  test('shows conflict recovery when two contexts edit the same request', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    await signInAsAdmin(pageA)
    await signInAsAdmin(pageB)
    await pageA.goto(`/requests/${MUTATION_REFERENCE}`)
    await pageB.goto(`/requests/${MUTATION_REFERENCE}`)

    await pageA.getByTestId('status-badge').click()
    await pageA.getByRole('menuitem', { name: 'In review' }).click()
    await expect(pageA.getByText('Status changed to In review')).toBeVisible()

    await pageB.getByTestId('status-badge').click()
    await pageB.getByRole('menuitem', { name: 'Rejected' }).click()

    await expect(
      pageB.getByText('This request was changed by someone else. It is now In review.'),
    ).toBeVisible()
    await expect(pageB.getByRole('button', { name: 'Reload' })).toBeVisible()

    await contextA.close()
    await contextB.close()
  })
})
