import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function waitForDashboardClients(page: Page): Promise<void> {
  await expect(page.getByLabel('Search requests')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Items per page' })).toBeVisible()
}
