import { test, expect } from '@playwright/test'
import { loginAs, API } from './fixtures.js'

test.describe('navigation (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await page.route(`${API}/**`, route => route.fulfill({ json: { items: [], total: 0 } }))
  })

  test('finance nav item visible and active on overview', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.nav-item').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('.nav-item').filter({ hasText: 'Community' })).toBeVisible()
  })

  test('user menu opens and contains profile + sign out', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.user-trigger').click()
    await expect(page.locator('.user-menu')).toBeVisible()
    await expect(page.locator('.user-menu-item').filter({ hasText: 'Profile' })).toBeVisible()
    await expect(page.locator('.user-menu-item').filter({ hasText: 'Organization' })).toBeVisible()
    await expect(page.locator('.user-menu-danger')).toHaveText(/Sign out/)
  })

  test('user name displays in topbar', async ({ page }) => {
    await page.goto('/app/')
    await expect(page.locator('.user-trigger')).toContainText('Bhakti Devi')
  })
})

test.describe('navigation (viewer)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'viewer')
    await page.route(`${API}/**`, route => route.fulfill({ json: { items: [], total: 0 } }))
  })

  test('viewer sees finance nav but not community', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.topbar').waitFor()
    await expect(page.locator('.nav-item').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('.nav-item').filter({ hasText: 'Community' })).toHaveCount(0)
  })

  test('overview shows finance card but not community for viewer', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.topbar').waitFor()
    const cards = page.locator('.card h3')
    await expect(cards.filter({ hasText: 'Finance' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Community' })).toHaveCount(0)
  })

  test('viewer can access finance page', async ({ page }) => {
    await page.goto('/app/finance/')
    await page.locator('.card-tab-group').waitFor()
    await expect(page.locator('.card-tab-group')).toBeVisible()
  })

  test('viewer can open organization page in read-only mode', async ({ page }) => {
    const settings = {
      org_name: 'ISKCON Montreal',
      org_city: 'Montreal',
      org_province: 'QC',
      org_country: 'Canada',
      charity_bn: '123456789RR0001',
      fiscal_year_end: '03-31',
      approval_threshold_cents: 25000,
      required_approvals: 2,
    }

    await page.route(`${API}/**`, async route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/org-settings') return route.fulfill({ json: settings })
      return route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.goto('/app/organization/')
    await expect(page.locator('h1')).toHaveText('Organization')
    await expect(page.locator('.badge').filter({ hasText: 'View only' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Save changes' })).toHaveCount(0)
    await expect(page.locator('.org-view-grid')).toContainText('123456789RR0001')
  })

  test('members page redirects viewer to overview', async ({ page }) => {
    await page.goto('/app/members/')
    await page.waitForURL('/app/')
  })
})

test.describe('organization (president)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'president')
  })

  test('president can edit and save organization settings', async ({ page }) => {
    let settings = {
      org_name: 'ISKCON Montreal',
      org_logo_url: '',
      org_address: '1626 Pie-IX Blvd',
      org_city: 'Montreal',
      org_province: 'QC',
      org_postal: 'H1V 2C5',
      org_country: 'Canada',
      charity_bn: '123456789RR0001',
      fiscal_year_end: '03-31',
      approval_threshold_cents: 25000,
      required_approvals: 2,
    }

    await page.route(`${API}/**`, async route => {
      const url = new URL(route.request().url())
      const method = route.request().method()
      if (url.pathname === '/api/org-settings' && method === 'GET') return route.fulfill({ json: settings })
      if (url.pathname === '/api/org-settings' && method === 'PUT') {
        settings = { ...settings, ...(JSON.parse(route.request().postData() || '{}')) }
        return route.fulfill({ json: settings })
      }
      return route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.goto('/app/organization/')
    await page.locator('#org-name').fill('ISKCON Montreal Temple')
    await page.locator('#org-threshold').fill('500')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()

    await expect(page.locator('.toast-success')).toContainText('Organization updated')
    await expect(page.locator('.org-summary-title')).toHaveText('ISKCON Montreal Temple')
    await expect(page.locator('.org-view-block').filter({ hasText: 'Auto-approval threshold' })).toContainText('$500.00')
  })
})
