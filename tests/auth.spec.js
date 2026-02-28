import { test, expect } from '@playwright/test'

// Helper: inject fake auth into localStorage before page loads
async function login(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mandala_token', 'test-jwt')
    localStorage.setItem('mandala_user', JSON.stringify({ name: 'Test User', email: 'test@example.com' }))
  })
}

test.describe('auth guard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/app/')
    await expect(page).toHaveURL(/login\.html/)
  })

  test('unauthenticated user cannot access donations', async ({ page }) => {
    await page.goto('/app/donations.html')
    await expect(page).toHaveURL(/login\.html/)
  })

  test('unauthenticated user cannot access expenses', async ({ page }) => {
    await page.goto('/app/expenses.html')
    await expect(page).toHaveURL(/login\.html/)
  })

  test('unauthenticated user cannot access members', async ({ page }) => {
    await page.goto('/app/members.html')
    await expect(page).toHaveURL(/login\.html/)
  })

  test('unauthenticated user cannot access settings', async ({ page }) => {
    await page.goto('/app/settings.html')
    await expect(page).toHaveURL(/login\.html/)
  })
})

test.describe('login page', () => {
  test('renders sign-in form', async ({ page }) => {
    await page.goto('/login.html')
    await expect(page.locator('h1')).toHaveText('Sign in')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('already authenticated user is redirected to app', async ({ page }) => {
    await login(page)
    await page.goto('/login.html')
    await expect(page).toHaveURL(/app\/index\.html/)
  })

  test('password toggle shows/hides password', async ({ page }) => {
    await page.goto('/login.html')
    const pw = page.locator('#password')
    const toggle = page.locator('.toggle-pw')
    await expect(pw).toHaveAttribute('type', 'password')
    await toggle.click()
    await expect(pw).toHaveAttribute('type', 'text')
    await toggle.click()
    await expect(pw).toHaveAttribute('type', 'password')
  })
})

test.describe('logout', () => {
  test('sign out clears auth and redirects to login', async ({ page }) => {
    // Set auth directly (no addInitScript — we want logout to stick)
    await page.goto('/app/', { waitUntil: 'commit' })
    await page.evaluate(() => {
      localStorage.setItem('mandala_token', 'test-jwt')
      localStorage.setItem('mandala_user', JSON.stringify({ name: 'Test User', email: 'test@example.com' }))
    })
    await page.goto('/app/')
    // Open user menu, click sign out
    await page.locator('.user-trigger').click()
    await page.locator('.user-menu-danger').click()
    await expect(page).toHaveURL(/login\.html/)
  })
})
