import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const ADMIN_ACCOUNT = {
  email: 'admin@assunnah.test',
  password: 'test.admin',
  name: 'Admin User',
}

export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto('/login?next=/requests')
  await page.getByLabel('Email', { exact: true }).fill(ADMIN_ACCOUNT.email)
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_ACCOUNT.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/requests')
}
