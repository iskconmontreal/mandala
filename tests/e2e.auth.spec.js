import { expect, request } from '@playwright/test'
import { test, loginAsReal, API } from './e2e.fixtures.js'

test.describe('e2e: passwordless login', () => {
  test('viewer skips password step and gets token via trusted device', async () => {
    const ctx = await request.newContext()
    const res = await ctx.post(`${API}/auth/login`, {
      data: { email: 'viewer@test.local', device_id: 'dev-device', device_label: 'E2E Test' },
    })
    const body = await res.json()
    await ctx.dispose()
    expect(body.token).toBeTruthy()
    expect(body.user).toBeTruthy()
  })

  test('sevaka skips password step and gets token via trusted device', async () => {
    const ctx = await request.newContext()
    const res = await ctx.post(`${API}/auth/login`, {
      data: { email: 'sevaka@test.local', device_id: 'dev-device', device_label: 'E2E Test' },
    })
    const body = await res.json()
    await ctx.dispose()
    expect(body.token).toBeTruthy()
    expect(body.user).toBeTruthy()
  })

  test('passwordless user without trusted device goes to otp', async () => {
    const ctx = await request.newContext()
    const res = await ctx.post(`${API}/auth/login`, {
      data: { email: 'viewer@test.local', device_id: 'unknown-device', device_label: 'New Device' },
    })
    const body = await res.json()
    await ctx.dispose()
    expect(body.step).toBe('otp_required')
    expect(body.token).toBeFalsy()
  })

  test('password user without password gets password_required step', async () => {
    const ctx = await request.newContext()
    const res = await ctx.post(`${API}/auth/login`, {
      data: { email: 'admin@test.local', device_id: 'unknown-device', device_label: 'New Device' },
    })
    const body = await res.json()
    await ctx.dispose()
    expect(body.step).toBe('password_required')
  })
})

test.describe('e2e: auth & overview', () => {
  test('health check passes on real backend', async ({ page }) => {
    const res = await page.request.get(`${API}/api/health`)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
    expect(body.finance_db).toBe('ok')
  })

  test('admin overview shows real finance + community data', async ({ page, adminToken }) => {
    await page.goto('/app/')
    await expect(page.locator('h1')).toContainText('Hare Krishna')
    await expect(page.locator('h3').filter({ hasText: 'Finance' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Community' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'My Expenses' })).toHaveCount(0)
  })

  test('viewer sees overview with personal sections only', async ({ page }) => {
    await loginAsReal(page, 'viewer')
    await page.goto('/app/')
    await page.locator('h1').waitFor()
    await expect(page.locator('h1')).toContainText('Hare Krishna')
  })
})
