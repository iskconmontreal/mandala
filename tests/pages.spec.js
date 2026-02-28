import { test, expect } from '@playwright/test'

async function login(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mandala_token', 'test-jwt')
    localStorage.setItem('mandala_user', JSON.stringify({ name: 'Test User', email: 'test@example.com' }))
  })
}

test.describe('finance overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/app/')
  })

  test('renders stat cards', async ({ page }) => {
    await expect(page.locator('.stat-label')).toHaveCount(3)
    await expect(page.locator('.stat-label').first()).toHaveText('Donations')
  })

  test('renders category breakdowns', async ({ page }) => {
    await expect(page.locator('h3').filter({ hasText: 'Donations by Category' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Expenses by Category' })).toBeVisible()
  })

  test('renders top donors table', async ({ page }) => {
    await expect(page.locator('h3').filter({ hasText: 'Top Donors' })).toBeVisible()
  })

  test('renders recent transactions', async ({ page }) => {
    await expect(page.locator('h3').filter({ hasText: 'Recent Transactions' })).toBeVisible()
  })

  test('year selector changes year', async ({ page }) => {
    const sel = page.locator('.year-select').first()
    await expect(sel).toBeVisible()
    const opts = sel.locator('option')
    await expect(opts).toHaveCount(3)
  })
})

test.describe('progress bar', () => {
  test('progress bar reaches done state after load', async ({ page }) => {
    await login(page)
    await page.goto('/app/')
    await expect(page.locator('.progress')).toHaveClass(/done/)
  })
})
