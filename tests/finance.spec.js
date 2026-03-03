import { test, expect } from '@playwright/test'

const TOKEN = 'header.' + btoa(JSON.stringify({
  permissions: ['expenses:view', 'expenses:create', 'donations:view', 'clients:view']
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
  }, TOKEN)
}

test.describe('finance section', () => {
  let errors
  let expenses

  test.beforeEach(async ({ page }) => {
    errors = []
    expenses = []

    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning' && msg.text().includes('Cycle')) errors.push(msg.text())
    })

    await login(page)

    await page.route(`${API}/**`, async route => {
      const url = new URL(route.request().url())
      const method = route.request().method()
      const path = url.pathname

      if (path === '/api/donations') {
        return route.fulfill({ json: { items: [], total: 0 } })
      }
      if (path === '/api/expenses') {
        if (method === 'POST') {
          const body = route.request().postDataJSON()
          expenses.push({ id: expenses.length + 1, ...body, status: 'draft' })
          return route.fulfill({ json: expenses.at(-1) })
        }
        return route.fulfill({ json: { items: [...expenses], total: expenses.length } })
      }
      if (path === '/api/clients') {
        return route.fulfill({ json: { items: [], total: 0 } })
      }
      route.fulfill({ json: {} })
    })

    await page.goto('/app/finance/')
    await page.locator('.card-tab-group').waitFor()
  })

  test.afterEach(() => {
    expect(errors).toEqual([])
  })

  test('shows three tabs: Expenses, Donations, Donors', async ({ page }) => {
    const tabs = page.locator('.card-tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0).locator('.stat-label')).toHaveText('Expenses')
    await expect(tabs.nth(1).locator('.stat-label')).toHaveText('Donations')
    await expect(tabs.nth(2).locator('.stat-label')).toHaveText('Donors')
  })

  test('expense form shows type tabs: Direct, Reimbursement, Advance', async ({ page }) => {
    await page.click('button:has-text("+ Expense")')
    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()

    const tabs = page.locator('.exp-type-tabs .tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toHaveText('Direct')
    await expect(tabs.nth(1)).toHaveText('Reimbursement')
    await expect(tabs.nth(2)).toHaveText('Advance')
    await expect(tabs.nth(0)).toHaveClass(/tab-active/)
  })

  test('no crash on keydown with undefined key (autofill)', async ({ page }) => {
    await page.click('button:has-text("+ Expense")')
    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()

    await page.locator('#exp-vendor').focus()
    await page.evaluate(() => {
      document.dispatchEvent(new Event('keydown'))
    })
    await page.locator('#exp-vendor').fill('Test')
  })

  test('add expense: open form, fill all fields, save, appears in table', async ({ page }) => {
    await page.click('button:has-text("+ Expense")')
    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()

    await expect(page.locator('#exp-vendor')).toBeVisible()
    await expect(page.locator('#exp-cat')).toBeVisible()
    await expect(page.locator('#exp-amount')).toBeVisible()
    await expect(page.locator('#exp-date')).toBeVisible()
    await expect(page.locator('#exp-desc')).toBeVisible()

    await page.fill('#exp-vendor', 'Hydro Quebec')
    await page.selectOption('#exp-cat', 'kitchen')
    await page.fill('#exp-amount', '142.50')
    await page.fill('#exp-desc', 'Monthly electricity bill')

    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    const row = page.locator('table tbody tr').first()
    await expect(row).toContainText('Hydro Quebec')
    await expect(row).toContainText('142.50')
    await expect(row).toContainText('Draft')
    await expect(row).toContainText('Kitchen')

    expect(expenses).toHaveLength(1)
    expect(expenses[0].paid_to).toBe('Hydro Quebec')
    expect(expenses[0].amount).toBe(14250)
    expect(expenses[0].category).toBe('kitchen')
  })
})
