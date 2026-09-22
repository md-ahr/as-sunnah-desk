import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function waitForInsights(page: Page): Promise<void> {
  await expect(page.getByRole('status', { name: 'Loading insights' })).toBeHidden({
    timeout: 30_000,
  })
  await expect(page.getByRole('columnheader', { name: 'Assignee' })).toBeVisible()
}
