import { test, expect } from '@playwright/test'

const TEST_TOKEN = 'header.' + btoa(JSON.stringify({ permissions: ['users:view', 'users:create', 'clients:view', 'clients:create'] })) + '.sig'

async function login(page) {
  await page.addInitScript((token) => {
    localStorage.setItem('mandala_token', token)
    localStorage.setItem('mandala_user', JSON.stringify({ name: 'Test User', email: 'test@example.com' }))
  }, TEST_TOKEN)
}

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('finance overview shows Finance nav active', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.nav-item.active')).toHaveText(/Finance/)
  })

  test('donations page renders', async ({ page }) => {
    await page.goto('/app/donations.html')
    await expect(page.locator('h1')).toHaveText('Donations')
  })

  test('expenses page renders', async ({ page }) => {
    await page.goto('/app/expenses.html')
    await expect(page.locator('h1')).toHaveText('Expenses')
  })

  test('finance sub-nav shows donations and expenses links', async ({ page }) => {
    await page.goto('/app/')
    const sub = page.locator('.nav-sub')
    await expect(sub.locator('.nav-sub-item')).toHaveCount(2)
    await expect(sub.locator('.nav-sub-item').first()).toHaveText('Donations')
    await expect(sub.locator('.nav-sub-item').last()).toHaveText('Expenses')
  })

  test('user menu opens and contains settings + sign out', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.user-trigger').click()
    await expect(page.locator('.user-menu')).toBeVisible()
    await expect(page.locator('.user-menu-item').first()).toHaveText('Settings')
    await expect(page.locator('.user-menu-danger')).toHaveText(/Sign out/)
  })

  test('user name displays in topbar', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.user-trigger')).toContainText('Test User')
  })
})
