import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { ADMIN_ACCOUNT } from './helpers/auth'

const SEEDED_ACCOUNTS = [
  {
    role: 'admin',
    ...ADMIN_ACCOUNT,
  },
  {
    role: 'manager',
    email: 'manager@assunnah.test',
    password: 'test.manager',
    name: 'Manager User',
  },
  {
    role: 'agent',
    email: 'agent@assunnah.test',
    password: 'test.agent',
    name: 'Agent User',
  },
  {
    role: 'viewer',
    email: 'viewer@assunnah.test',
    password: 'test.viewer',
    name: 'Viewer User',
  },
] as const

async function signIn(
  page: Page,
  account: { email: string; password: string },
): Promise<void> {
  await page.goto('/login?next=/requests')
  await page.getByLabel('Email', { exact: true }).fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/requests')
}

test.describe('authentication', () => {
  test.describe.configure({ mode: 'serial' })

  test('redirects unauthenticated users to login with next parameter', async ({ page }) => {
    await page.goto('/requests')

    await expect(page).toHaveURL(/\/login\?next=%2Frequests/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('rejects invalid credentials with a generic error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email', { exact: true }).fill('unknown@assunnah.test')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password.' }),
    ).toBeVisible()
  })

  test('signs in and returns to the requested destination', async ({ page }) => {
    await signIn(page, SEEDED_ACCOUNTS[0])
    await expect(page.getByRole('heading', { name: 'Service requests' })).toBeVisible()
    await page.getByRole('button', { name: `Account menu, ${SEEDED_ACCOUNTS[0].name}` }).click()
    await expect(page.getByRole('menu').getByText(SEEDED_ACCOUNTS[0].name)).toBeVisible()
  })

  test('signs out and returns to login', async ({ page }) => {
    await signIn(page, SEEDED_ACCOUNTS[0])

    await page.getByRole('button', { name: `Account menu, ${SEEDED_ACCOUNTS[0].name}` }).click()
    await page.getByRole('menuitem', { name: 'Sign out' }).click()

    await expect(page).toHaveURL('/login')
    await page.goto('/requests')
    await expect(page).toHaveURL(/\/login\?next=%2Frequests/)
  })

  for (const account of SEEDED_ACCOUNTS) {
    test(`${account.role} account can sign in and sign out`, async ({ page }) => {
      await signIn(page, account)
      await page.getByRole('button', { name: `Account menu, ${account.name}` }).click()
      await expect(page.getByRole('menu').getByText(account.name)).toBeVisible()

      await page.getByRole('menuitem', { name: 'Sign out' }).click()
      await expect(page).toHaveURL('/login')
    })
  }
})
