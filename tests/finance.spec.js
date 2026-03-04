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
    if (path === '/api/audit') return route.fulfill({ json: { items: [], total: 0 } })
    if (method !== 'GET') return route.fulfill({ status: 404, json: { error: 'Unexpected mutation in mock: ' + path } })
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

  test('receipt scan: auto-fills form and files array sent to backend on save', async ({ page }) => {
    const expenses = []
    let savedBody = null

    await page.route(`${API}/**`, async route => {
      const url = new URL(route.request().url())
      const method = route.request().method()
      const path = url.pathname

      if (path === '/api/documents/extract' && method === 'POST') {
        return route.fulfill({ json: {
          extracted_data: { amount: '142.50', vendor: 'Hydro Quebec', category: 'utilities', date: '2025-01-15' },
          file_info: { file_name: 'abc123.jpg', original_name: 'receipt.jpg', mime_type: 'image/jpeg', file_size: 1024 },
        } })
      }
      if (path === '/api/expenses' && method === 'POST') {
        savedBody = route.request().postDataJSON()
        const e = { id: 1, ...savedBody, status: 'draft' }
        expenses.push(e)
        return route.fulfill({ json: e })
      }
      route.fulfill({ json: { items: [...expenses], total: expenses.length } })
    })

    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()

    const minimalJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd3,
      0xff, 0xd9,
    ])

    await page.setInputFiles('#receipt-input', {
      name: 'receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: minimalJpeg,
    })

    await expect(page.locator('.receipt-thumb')).toHaveCount(1, { timeout: 5000 })
    await expect(page.locator('#exp-amount')).toHaveValue('142.50', { timeout: 5000 })
    await expect(page.locator('#exp-vendor')).toHaveValue('Hydro Quebec')

    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(savedBody).not.toBeNull()
    expect(savedBody.files).toHaveLength(1)
    expect(savedBody.files[0].tmp_name).toBe('abc123.jpg')
    expect(savedBody.files[0].original_name).toBe('receipt.jpg')
    expect(savedBody.files[0].mime_type).toBe('image/jpeg')
  })

  test('save expense shows success toast', async ({ page }) => {
    await mockFinance(page, { expenses: [] })
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await page.fill('#exp-vendor', 'Test Vendor')
    await page.fill('#exp-amount', '50.00')
    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.toast-success')).toContainText('Expense saved')
  })

  test('save donation shows success toast', async ({ page }) => {
    await mockFinance(page, { donations: [] })
    await openFinance(page, 'donations')
    await page.click('button:has-text("+ Donation")')
    await page.fill('#don-amount', '25.00')
    await page.click('button:has-text("Save Donation")')
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.toast-success')).toContainText('Donation saved')
  })

  test('save expense blocked while receipt is still extracting', async ({ page }) => {
    let extractResolve
    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      const method = route.request().method()
      if (path === '/api/documents/extract' && method === 'POST') {
        await new Promise(r => { extractResolve = r })
        return route.fulfill({ json: { extracted_data: { amount: '10.00' }, file_info: { file_name: 'f.jpg', original_name: 'r.jpg', mime_type: 'image/jpeg', file_size: 100 } } })
      }
      route.fulfill({ json: { items: [], total: 0 } })
    })

    const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9])
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await page.setInputFiles('#receipt-input', { name: 'r.jpg', mimeType: 'image/jpeg', buffer: minJpeg })
    await expect(page.locator('.receipt-thumb')).toHaveCount(1, { timeout: 5000 })

    await page.fill('#exp-vendor', 'Test')
    await page.fill('#exp-amount', '10.00')
    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.login-error')).toContainText('Please wait for receipt processing')

    extractResolve()
  })

  test('multiple receipts: all file infos sent on save', async ({ page }) => {
    const expenses = []
    let savedBody = null
    let callCount = 0

    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      const method = route.request().method()
      if (path === '/api/documents/extract' && method === 'POST') {
        callCount++
        return route.fulfill({ json: {
          extracted_data: { amount: '50.00' },
          file_info: { file_name: `file${callCount}.jpg`, original_name: `receipt${callCount}.jpg`, mime_type: 'image/jpeg', file_size: 512 },
        } })
      }
      if (path === '/api/expenses' && method === 'POST') {
        savedBody = route.request().postDataJSON()
        const e = { id: 1, ...savedBody, status: 'draft' }
        expenses.push(e)
        return route.fulfill({ json: e })
      }
      route.fulfill({ json: { items: [...expenses], total: expenses.length } })
    })

    const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9])
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')

    await page.setInputFiles('#receipt-input', [
      { name: 'receipt1.jpg', mimeType: 'image/jpeg', buffer: minJpeg },
      { name: 'receipt2.jpg', mimeType: 'image/jpeg', buffer: minJpeg },
    ])

    await expect(page.locator('.receipt-thumb')).toHaveCount(2, { timeout: 5000 })
    await page.fill('#exp-vendor', 'Multi Vendor')
    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(savedBody.files).toHaveLength(2)
    expect(savedBody.files[0].tmp_name).toBe('file1.jpg')
    expect(savedBody.files[1].tmp_name).toBe('file2.jpg')
  })

  test('receipt extraction failure: save proceeds without that file', async ({ page }) => {
    const expenses = []
    let savedBody = null

    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      const method = route.request().method()
      if (path === '/api/documents/extract' && method === 'POST') {
        return route.fulfill({ status: 500, json: { message: 'OCR failed' } })
      }
      if (path === '/api/expenses' && method === 'POST') {
        savedBody = route.request().postDataJSON()
        return route.fulfill({ json: { id: 1, ...savedBody, status: 'draft' } })
      }
      route.fulfill({ json: { items: [...expenses], total: expenses.length } })
    })

    const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9])
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await page.setInputFiles('#receipt-input', { name: 'bad.jpg', mimeType: 'image/jpeg', buffer: minJpeg })
    await expect(page.locator('.receipt-thumb.receipt-error')).toHaveCount(1, { timeout: 5000 })

    await page.fill('#exp-vendor', 'Fallback Vendor')
    await page.fill('#exp-amount', '99.00')
    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(savedBody.files).toBeUndefined()
    errors = []
  })

  test('remove receipt after autofill: form keeps values but no files sent', async ({ page }) => {
    const expenses = []
    let savedBody = null

    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      const method = route.request().method()
      if (path === '/api/documents/extract' && method === 'POST') {
        return route.fulfill({ json: {
          extracted_data: { amount: '75.00', vendor: 'Removed Store' },
          file_info: { file_name: 'kept.jpg', original_name: 'r.jpg', mime_type: 'image/jpeg', file_size: 256 },
        } })
      }
      if (path === '/api/expenses' && method === 'POST') {
        savedBody = route.request().postDataJSON()
        return route.fulfill({ json: { id: 1, ...savedBody, status: 'draft' } })
      }
      route.fulfill({ json: { items: [...expenses], total: expenses.length } })
    })

    const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9])
    await openFinance(page)
    await page.click('button:has-text("+ Expense")')
    await page.setInputFiles('#receipt-input', { name: 'r.jpg', mimeType: 'image/jpeg', buffer: minJpeg })

    await expect(page.locator('#exp-vendor')).toHaveValue('Removed Store', { timeout: 5000 })
    await expect(page.locator('#exp-amount')).toHaveValue('75.00')

    await page.locator('.receipt-remove').click()
    await expect(page.locator('.receipt-thumb')).toHaveCount(0)

    await page.click('button:has-text("Save Expense")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(savedBody.paid_to).toBe('Removed Store')
    expect(savedBody.files).toBeUndefined()
  })

  test('donation receipt scan: file info sent to backend on save', async ({ page }) => {
    const donations = []
    let savedBody = null

    await page.route(`${API}/**`, async route => {
      const path = new URL(route.request().url()).pathname
      const method = route.request().method()
      if (path === '/api/documents/extract' && method === 'POST') {
        return route.fulfill({ json: {
          extracted_data: { amount: '100.00', method: 'cheque' },
          file_info: { file_name: 'don123.jpg', original_name: 'don-receipt.jpg', mime_type: 'image/jpeg', file_size: 2048 },
        } })
      }
      if (path === '/api/donations' && method === 'POST') {
        savedBody = route.request().postDataJSON()
        const d = { id: 1, ...savedBody, status: 'draft' }
        donations.push(d)
        return route.fulfill({ json: d })
      }
      route.fulfill({ json: { items: [...donations], total: donations.length } })
    })

    const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9])
    await openFinance(page, 'donations')
    await page.click('button:has-text("+ Donation")')
    await expect(page.getByRole('heading', { name: 'Add Donation' })).toBeVisible()

    await page.setInputFiles('#don-receipt-input', { name: 'don-receipt.jpg', mimeType: 'image/jpeg', buffer: minJpeg })
    await expect(page.locator('#don-amount')).toHaveValue('100.00', { timeout: 5000 })

    await page.click('button:has-text("Save Donation")')
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })

    expect(savedBody.files).toHaveLength(1)
    expect(savedBody.files[0].tmp_name).toBe('don123.jpg')
    expect(savedBody.files[0].original_name).toBe('don-receipt.jpg')
  })
})
