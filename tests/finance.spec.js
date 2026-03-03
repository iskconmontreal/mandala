import { test, expect } from '@playwright/test'
import { loginAs, API } from './fixtures.js'

function mockFinance(page, { donations = [], expenses = [], clients = [] } = {}) {
  return page.route(`${API}/**`, async route => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const path = url.pathname
    const idMatch = path.match(/\/api\/expenses\/(\d+)\/(\w+)/)

    if (idMatch) {
      const [, id, action] = idMatch
      const exp = expenses.find(e => e.id == id)
      const transitions = { submit: 'submitted', approve: 'approved', pay: 'paid', close: 'closed', return: 'returned', reject: 'rejected' }
      if (exp && transitions[action]) { exp.status = transitions[action]; return route.fulfill({ json: exp }) }
    }

    if (path === '/api/donations' && method === 'POST') {
      const body = route.request().postDataJSON()
      const d = { id: donations.length + 1, ...body, status: 'draft' }
      donations.push(d)
      return route.fulfill({ json: d })
    }
    if (path === '/api/donations' && method === 'GET') {
      return route.fulfill({ json: { items: [...donations], total: donations.length } })
    }
    if (path.startsWith('/api/donations/') && method === 'DELETE') {
      const id = +path.split('/').at(-1)
      const i = donations.findIndex(d => d.id === id)
      if (i >= 0) donations.splice(i, 1)
      return route.fulfill({ status: 204 })
    }
    if (path.startsWith('/api/donations/') && method === 'PUT') {
      const id = +path.split('/').at(-1)
      const body = route.request().postDataJSON()
      const i = donations.findIndex(d => d.id === id)
      if (i >= 0) donations[i] = { ...donations[i], ...body }
      return route.fulfill({ json: donations[i] ?? {} })
    }

    if (path === '/api/expenses') {
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const e = { id: expenses.length + 1, ...body, status: 'draft' }
        expenses.push(e)
        return route.fulfill({ json: e })
      }
      return route.fulfill({ json: { items: [...expenses], total: expenses.length } })
    }

    if (path === '/api/clients') return route.fulfill({ json: { items: clients, total: clients.length } })
    if (path.startsWith('/api/expenses/') && method === 'DELETE') {
      const id = +path.split('/').at(-1)
      const i = expenses.findIndex(e => e.id === id)
      if (i >= 0) expenses.splice(i, 1)
      return route.fulfill({ status: 204 })
    }
    if (path.startsWith('/api/expenses/') && method === 'GET') {
      return route.fulfill({ json: { items: [], total: 0 } })
    }
    route.fulfill({ json: { items: [], total: 0 } })
  })
}

async function openFinance(page, tab = 'expenses') {
  await page.goto(`/app/finance/#${tab}`)
  await page.locator('.card-tab-group').waitFor()
}

test.describe('finance section', () => {
  let errors

  test.beforeEach(async ({ page }) => {
    errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning' && msg.text().includes('Cycle')) errors.push(msg.text())
    })
    await loginAs(page, 'treasurer')
  })

  test.afterEach(() => { expect(errors).toEqual([]) })

  test('shows three tabs: Expenses, Donations, Donors', async ({ page }) => {
    await mockFinance(page)
    await openFinance(page)
    const tabs = page.locator('.card-tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0).locator('.stat-label')).toHaveText('Expenses')
    await expect(tabs.nth(1).locator('.stat-label')).toHaveText('Donations')
    await expect(tabs.nth(2).locator('.stat-label')).toHaveText('Donors')
  })

  test('expense form shows type tabs: Direct, Reimbursement, Advance', async ({ page }) => {
    await mockFinance(page)
    await openFinance(page)
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
    await mockFinance(page)
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await page.locator('#exp-vendor').focus()
    await page.evaluate(() => document.dispatchEvent(new Event('keydown')))
    await page.locator('#exp-vendor').fill('Test')
  })

  test('add expense: fill fields → save → appears in table', async ({ page }) => {
    const expenses = []
    await mockFinance(page, { expenses })
    await openFinance(page)

    await page.click('button:has-text("+ Expense")')
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

  test('add donation: fill fields → save → appears in donations table', async ({ page }) => {
    const donations = []
    await mockFinance(page, { donations })
    await openFinance(page, 'donations')

    await page.click('button:has-text("+ Donation")')
    await expect(page.getByRole('heading', { name: 'Add Donation' })).toBeVisible()

    await page.fill('#don-amount', '50.00')
    await page.selectOption('#don-method', 'cash')
    await page.selectOption('#don-cat', 'general')
    await page.click('button:has-text("Save Donation")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    const donSection = page.locator('section').nth(1)
    await expect(donSection.locator('tr.row-link').first()).toContainText('50.00')
    await expect(donSection.locator('tr.row-link').first()).toContainText('General')

    expect(donations).toHaveLength(1)
    expect(donations[0].amount).toBe(5000)
    expect(donations[0].method).toBe('cash')
  })

  test('add anonymous donation (no donor) works', async ({ page }) => {
    const donations = []
    await mockFinance(page, { donations })
    await openFinance(page, 'donations')

    await page.click('button:has-text("+ Donation")')
    await page.fill('#don-amount', '25.00')
    await page.click('button:has-text("Save Donation")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(donations[0].client_id).toBeFalsy()
  })

  test('delete donation: two-step confirm in modal (no browser dialog)', async ({ page }) => {
    const donations = [{ id: 1, amount: 5000, method: 'cash', category: 'general', date_received: '2025-01-15', note: '' }]
    await mockFinance(page, { donations })
    await openFinance(page, 'donations')

    await page.locator('section').nth(1).locator('tr.row-link').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Donation' })).toBeVisible()

    await page.click('button:has-text("Delete")')
    await expect(page.locator('button:has-text("Yes")')).toBeVisible()
    await expect(page.locator('button:has-text("No")')).toBeVisible()
    await expect(page.locator('text=Delete permanently?')).toBeVisible()

    await page.click('button:has-text("Yes")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })
    expect(donations).toHaveLength(0)
  })

  test('delete cancel (No) keeps record', async ({ page }) => {
    const donations = [{ id: 1, amount: 5000, method: 'cash', category: 'general', date_received: '2025-01-15', note: '' }]
    await mockFinance(page, { donations })
    await openFinance(page, 'donations')

    await page.locator('section').nth(1).locator('tr.row-link').first().click()
    await page.click('button:has-text("Delete")')
    await page.click('button:has-text("No")')
    await expect(page.locator('button:has-text("Delete")')).toBeVisible()
    expect(donations).toHaveLength(1)
  })

  test('approve button NOT visible without expenses:approve', async ({ page }) => {
    await loginAs(page, 'member')
    const expenses = [{ id: 1, amount: 5000, paid_to: 'Vendor', category: 'kitchen', expense_date: '2025-01-10', status: 'submitted' }]
    await mockFinance(page, { expenses })
    await openFinance(page)

    await page.locator('table tbody tr').first().click()
    await expect(page.locator('button:has-text("Approve")')).toHaveCount(0)
  })

  test('expense filter by category reduces results', async ({ page }) => {
    const expenses = [
      { id: 1, amount: 1000, paid_to: 'A', category: 'kitchen', expense_date: '2025-01-01', status: 'draft' },
      { id: 2, amount: 2000, paid_to: 'B', category: 'utilities', expense_date: '2025-01-02', status: 'draft' },
    ]
    await mockFinance(page, { expenses })
    await openFinance(page)
    await page.locator('tr.row-link').first().waitFor()

    await page.click('button:has-text("Filter")')
    await expect(page.locator('.modal-overlay')).toBeVisible()
    await page.locator('.modal select').nth(1).selectOption('kitchen')
    await page.locator('.modal .btn-primary').click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible()

    const expSection = page.locator('section').first()
    await expect(expSection.locator('tr.row-link')).toHaveCount(1)
    await expect(expSection.locator('tr.row-link').first()).toContainText('Kitchen')
  })

  test('expense filter chip appears and can be dismissed', async ({ page }) => {
    const expenses = [
      { id: 1, amount: 1000, paid_to: 'A', category: 'kitchen', expense_date: '2025-01-01', status: 'draft' },
      { id: 2, amount: 2000, paid_to: 'B', category: 'utilities', expense_date: '2025-01-02', status: 'draft' },
    ]
    await mockFinance(page, { expenses })
    await openFinance(page)
    await page.locator('tr.row-link').first().waitFor()

    await page.click('button:has-text("Filter")')
    await page.locator('.modal select').nth(1).selectOption('kitchen')
    await page.locator('.modal .btn-primary').click()

    await expect(page.locator('.filter-chips .chip')).toHaveCount(1)
    await expect(page.locator('.filter-chips .chip')).toContainText('Kitchen')

    await page.locator('.filter-chips .chip').click()
    await expect(page.locator('.filter-chips')).not.toBeVisible()
    await expect(page.locator('section').first().locator('tr.row-link')).toHaveCount(2)
  })

  test('donation search filter reduces results', async ({ page }) => {
    const donations = [
      { id: 1, amount: 5000, method: 'cash', category: 'general', date_received: '2025-01-01', note: 'sunday feast' },
      { id: 2, amount: 3000, method: 'cheque', category: 'building_fund', date_received: '2025-01-02', note: 'building' },
    ]
    await mockFinance(page, { donations })
    await openFinance(page, 'donations')
    await page.locator('section').nth(1).locator('tr.row-link').first().waitFor()

    await page.fill('input[placeholder="Search donor or note…"]', 'sunday')

    const donSection = page.locator('section').nth(1)
    await expect(donSection.locator('tr.row-link')).toHaveCount(1, { timeout: 5000 })
    await expect(donSection.locator('tr.row-link').first()).toContainText('sunday feast')
  })

  test('expense workflow: draft can be submitted for approval', async ({ page }) => {
    const expenses = [{ id: 1, amount: 14250, paid_to: 'Hydro Quebec', category: 'utilities', expense_date: '2025-01-01', status: 'draft' }]
    await mockFinance(page, { expenses })
    await openFinance(page)
    await page.locator('tr.row-link').first().waitFor()

    await page.locator('tr.row-link').first().click()
    await expect(page.locator('.modal-overlay')).toBeVisible()
    await page.click('button:has-text("Submit for Approval")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    await expect(page.locator('tr.row-link').first().locator('.badge').filter({ hasText: 'Submitted' })).toBeVisible()
  })

  test('shows truncation warning when total > items loaded', async ({ page }) => {
    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/donations') return route.fulfill({ json: { items: Array(10).fill({ id: 1, amount: 100, date_received: '2025-01-01', method: 'cash', category: 'general' }), total: 1500 } })
      if (path === '/api/expenses') return route.fulfill({ json: { items: [], total: 0 } })
      if (path === '/api/clients') return route.fulfill({ json: { items: [], total: 0 } })
      route.fulfill({ json: { items: [], total: 0 } })
    })
    await openFinance(page)
    await expect(page.locator('.truncation-warn')).toBeVisible()
  })

  test('no truncation warning when all records loaded', async ({ page }) => {
    await mockFinance(page)
    await openFinance(page)
    await page.locator('.card-tab-group').waitFor()
    await expect(page.locator('.truncation-warn')).not.toBeVisible()
  })

  test('loadErr shown when API fails', async ({ page }) => {
    await page.route(`${API}/**`, route => route.fulfill({ status: 500, json: { message: 'Failed to load data' } }))
    await page.goto('/app/finance/#expenses')
    await expect(page.locator('.login-error').filter({ hasText: /fail/i }).first()).toBeVisible({ timeout: 10000 })
    errors = []
  })

  test('CSV export downloads a file from expenses tab', async ({ page }) => {
    await mockFinance(page, { expenses: [{ id: 1, amount: 1000, paid_to: 'Vendor', category: 'kitchen', expense_date: '2025-01-01', status: 'draft' }] })
    await openFinance(page)
    await page.locator('section').first().locator('tr.row-link').first().waitFor()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export")')
    ])
    expect(download.suggestedFilename()).toBe('expenses.csv')
  })

  test('CSV export downloads from donations tab', async ({ page }) => {
    await mockFinance(page, { donations: [{ id: 1, amount: 5000, method: 'cash', category: 'general', date_received: '2025-01-01', note: '' }] })
    await openFinance(page, 'donations')
    await page.locator('section').nth(1).locator('tr.row-link').first().waitFor()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('section').nth(1).locator('button:has-text("Export")').click()
    ])
    expect(download.suggestedFilename()).toBe('donations.csv')
  })
})
