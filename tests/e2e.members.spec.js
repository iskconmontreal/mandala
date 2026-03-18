import { expect, request } from '@playwright/test'
import { test, loginAsReal, API } from './e2e.fixtures.js'

test.describe('e2e: members', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsReal(page, 'admin')
  })

  test('members page loads real data', async ({ page }) => {
    await page.goto('/app/members/')
    const rows = page.locator('table tbody tr').filter({ hasNotText: 'Loading…' })
    await rows.first().waitFor({ timeout: 15_000 })
    expect(await rows.count()).toBeGreaterThan(5)
  })

  test('search filter finds specific member', async ({ page }) => {
    await page.goto('/app/members/')
    const rows = page.locator('table tbody tr').filter({ hasNotText: 'Loading…' })
    await rows.first().waitFor({ timeout: 15_000 })
    const allRows = await rows.count()

    await page.fill('input[type="search"]', 'Charith')
    await page.waitForTimeout(500)

    const filteredRows = await rows.count()
    expect(filteredRows).toBeLessThan(allRows)
    expect(filteredRows).toBeGreaterThan(0)
  })

  test('member detail opens on row click', async ({ page }) => {
    await page.goto('/app/members/')
    const rows = page.locator('table tbody tr').filter({ hasNotText: 'Loading…' })
    await rows.first().waitFor({ timeout: 15_000 })

    await rows.first().click()
    await page.locator('.modal').waitFor()
    await expect(page.locator('.modal')).toBeVisible()
  })
})
