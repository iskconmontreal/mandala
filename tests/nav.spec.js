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

  test('overview shows finance section but not community for viewer', async ({ page }) => {
    await page.goto('/app/')
    await page.locator('.topbar').waitFor()
    await expect(page.locator('h3').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Community' })).toHaveCount(0)
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
  const COMPLETE = {
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

  let settings, lastPayload

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'president')
    settings = { ...COMPLETE }
    lastPayload = null
    await page.route(`${API}/**`, async route => {
      const url = new URL(route.request().url())
      const method = route.request().method()
      if (url.pathname === '/api/org-settings' && method === 'GET') return route.fulfill({ json: settings })
      if (url.pathname === '/api/org-settings' && method === 'PUT') {
        lastPayload = JSON.parse(route.request().postData() || '{}')
        settings = { ...settings, ...lastPayload }
        return route.fulfill({ json: settings })
      }
      return route.fulfill({ json: { items: [], total: 0 } })
    })
  })

  test('changing approval threshold updates rule text and sends correct payload', async ({ page }) => {
    await page.goto('/app/organization/')
    const thresholdCard = page.locator('.org-rule-card').filter({ hasText: 'Auto-approval threshold' })
    await expect(thresholdCard).toContainText('$250.00')
    await expect(thresholdCard).toContainText('Expenses under $250.00 auto-approve')

    await page.locator('#org-threshold').fill('500')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()

    await expect(thresholdCard).toContainText('$500.00')
    await expect(thresholdCard).toContainText('Expenses under $500.00 auto-approve')
    expect(lastPayload.approval_threshold_cents).toBe(50000)
  })

  test('setting threshold to 0 shows disabled state', async ({ page }) => {
    await page.goto('/app/organization/')
    await page.locator('#org-threshold').fill('0')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()

    const thresholdCard = page.locator('.org-rule-card').filter({ hasText: 'Auto-approval threshold' })
    await expect(thresholdCard).toContainText('Disabled')
    await expect(thresholdCard).toContainText('All expenses require full approval')
    expect(lastPayload.approval_threshold_cents).toBe(0)
  })

  test('changing required approvals updates count and explanation', async ({ page }) => {
    await page.goto('/app/organization/')
    const approvalCard = page.locator('.org-rule-card').filter({ hasText: 'Required approvals' })
    await expect(approvalCard.locator('.org-rule-value')).toHaveText('2')
    await expect(approvalCard).toContainText('2 approvals needed')

    await page.locator('#org-required-approvals').fill('3')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()

    await expect(approvalCard.locator('.org-rule-value')).toHaveText('3')
    await expect(approvalCard).toContainText('3 approvals needed')
    expect(lastPayload.required_approvals).toBe(3)
  })

  test('setting required approvals to 1 uses singular text', async ({ page }) => {
    await page.goto('/app/organization/')
    await page.locator('#org-required-approvals').fill('1')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()

    const approvalCard = page.locator('.org-rule-card').filter({ hasText: 'Required approvals' })
    await expect(approvalCard.locator('.org-rule-value')).toHaveText('1')
    await expect(approvalCard).toContainText('One approval needed')
  })

  test('receipt readiness shows ready when all fields present', async ({ page }) => {
    await page.goto('/app/organization/')
    const banner = page.locator('.org-readiness')
    await expect(banner).toHaveClass(/org-readiness-ok/)
    await expect(banner).toContainText('Tax receipts ready')
  })

  test('clearing a receipt field flips banner to incomplete with missing field', async ({ page }) => {
    settings = { ...COMPLETE, charity_bn: '' }
    await page.goto('/app/organization/')
    const banner = page.locator('.org-readiness')
    await expect(banner).toHaveClass(/org-readiness-warn/)
    await expect(banner).toContainText('Tax receipts incomplete')
    await expect(banner).toContainText('Missing: charity BN')
  })

  test('multiple missing receipt fields listed in banner', async ({ page }) => {
    settings = { ...COMPLETE, org_name: '', org_address: '', charity_bn: '' }
    await page.goto('/app/organization/')
    const banner = page.locator('.org-readiness')
    await expect(banner).toContainText('Missing: name, charity BN, address')
  })

  test('saving receipt identity fields sends correct payload', async ({ page }) => {
    await page.goto('/app/organization/')
    await page.locator('#org-name').fill('New Temple Name')
    await page.locator('#org-charity-bn').fill('999888777RR0002')
    await page.locator('#org-address').fill('42 New Street')
    await page.locator('#org-city').fill('Toronto')
    await page.locator('#org-province').fill('ON')
    await page.locator('#org-postal').fill('M5V 1A1')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()

    expect(lastPayload.org_name).toBe('New Temple Name')
    expect(lastPayload.charity_bn).toBe('999888777RR0002')
    expect(lastPayload.org_address).toBe('42 New Street')
    expect(lastPayload.org_city).toBe('Toronto')
    expect(lastPayload.org_province).toBe('ON')
    expect(lastPayload.org_postal).toBe('M5V 1A1')
  })

  test('filling missing fields flips banner to ready after save', async ({ page }) => {
    settings = { ...COMPLETE, charity_bn: '' }
    await page.goto('/app/organization/')
    await expect(page.locator('.org-readiness')).toHaveClass(/org-readiness-warn/)

    await page.locator('#org-charity-bn').fill('123456789RR0001')
    await page.locator('button').filter({ hasText: 'Save changes' }).click()
    await expect(page.locator('.toast-success')).toBeVisible()
    await expect(page.locator('.org-readiness')).toHaveClass(/org-readiness-ok/)
    await expect(page.locator('.org-readiness')).toContainText('Tax receipts ready')
  })
})
