import { test, expect } from '@playwright/test'

const ADMIN_TOKEN = 'header.' + btoa(JSON.stringify({
  permissions: ['users:view', 'users:create', 'clients:view', 'clients:create', 'donations:view', 'expenses:view']
})) + '.sig'

const VIEWER_TOKEN = 'header.' + btoa(JSON.stringify({ permissions: [] })) + '.sig'

async function login(page, token = ADMIN_TOKEN) {
  await page.addInitScript((t) => {
    localStorage.setItem('mandala_token', t)
    localStorage.setItem('mandala_user', JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      meta: { first_name: 'Test', last_name: 'User' }
    }))
  }, token)
}

test.describe('navigation (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('finance nav item visible and active on overview', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.nav-item').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('.nav-item').filter({ hasText: 'Members' })).toBeVisible()
  })

  test('user menu opens and contains profile + sign out', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.user-trigger').click()
    await expect(page.locator('.user-menu')).toBeVisible()
    await expect(page.locator('.user-menu-item').first()).toHaveText('Profile')
    await expect(page.locator('.user-menu-danger')).toHaveText(/Sign out/)
  })

  test('user name displays in topbar', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.user-trigger')).toContainText('Test User')
  })
})

test.describe('navigation (viewer)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, VIEWER_TOKEN)
  })

  test('finance and members nav items hidden for viewer', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.topbar').waitFor()
    await expect(page.locator('.nav-item').filter({ hasText: 'Finance' })).toHaveCount(0)
    await expect(page.locator('.nav-item').filter({ hasText: 'Members' })).toHaveCount(0)
  })

  test('overview hides org sections for viewer', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.topbar').waitFor()
    const cards = page.locator('.card h3')
    await expect(cards.filter({ hasText: 'Finance' })).toHaveCount(0)
    await expect(cards.filter({ hasText: 'Members' })).toHaveCount(0)
  })

  test('finance page redirects viewer to overview', async ({ page }) => {
    await page.goto('/app/finance/')
    await page.waitForURL('/app/')
  })

  test('members page redirects viewer to overview', async ({ page }) => {
    await page.goto('/app/members/')
    await page.waitForURL('/app/')
  })
})
