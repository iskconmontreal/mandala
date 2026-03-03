import { test, expect } from '@playwright/test'

const ADMIN_TOKEN = 'header.' + btoa(JSON.stringify({
  permissions: ['donations:view', 'expenses:view', 'clients:view']
})) + '.sig'

const API = 'https://api.iskconmontreal.ca'

async function login(page) {
  await page.addInitScript((token) => {
    localStorage.setItem('mandala_token', token)
    localStorage.setItem('mandala_user', JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      meta: { first_name: 'Test', last_name: 'User' }
    }))
  }, ADMIN_TOKEN)
}

test.describe('overview page (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)

    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/donations') return route.fulfill({ json: { items: [], total: 0 } })
      if (path === '/api/expenses') return route.fulfill({ json: { items: [], total: 0 } })
      if (path === '/api/clients') return route.fulfill({ json: { items: [], total: 0 } })
      if (path.startsWith('/api/me/')) return route.fulfill({ json: { items: [], total: 0 } })
      if (path === '/api/audit') return route.fulfill({ json: { items: [], total: 0 } })
      route.fulfill({ json: {} })
    })

    await page.goto('/app/')
  })

  test('renders finance pulse card', async ({ page }) => {
    await expect(page.locator('h3').filter({ hasText: 'Finance' })).toBeVisible()
  })

  test('renders members pulse card', async ({ page }) => {
    await expect(page.locator('h3').filter({ hasText: 'Members' })).toBeVisible()
  })

  test('renders quick links for finance and members', async ({ page }) => {
    await expect(page.locator('.card-grid a').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('.card-grid a').filter({ hasText: 'Members' })).toBeVisible()
  })
})

test.describe('progress bar', () => {
  test('progress bar reaches done state after load', async ({ page }) => {
    await login(page)
    await page.route(`${API}/**`, route => route.fulfill({ json: { items: [], total: 0 } }))
    await page.goto('/app/')
    await expect(page.locator('.progress')).toHaveClass(/done/)
  })
})
