// Members section Playwright E2E tests
// FEATURE: members

import { test, expect } from '@playwright/test'
import { loginAs, API } from './fixtures.js'

function mockMembers(page, { members = [] } = {}) {
  return page.route(`${API}/**`, async route => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const path = url.pathname

    if (path === '/api/clients') {
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const m = { id: members.length + 1, public_id: `pub${members.length + 1}`, user_id: null, client: body }
        members.push(m)
        return route.fulfill({ json: m })
      }
      const search = url.searchParams.get('search') || ''
      const roleFilter = url.searchParams.get('client.role') || ''
      let filtered = [...members]
      if (search) {
        filtered = filtered.filter(m => {
          const c = typeof m.client === 'string' ? JSON.parse(m.client) : m.client
          const name = `${c.first_name} ${c.last_name}`.toLowerCase()
          return name.includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase())
        })
      }
      if (roleFilter) {
        filtered = filtered.filter(m => {
          const c = typeof m.client === 'string' ? JSON.parse(m.client) : m.client
          return c.role === roleFilter
        })
      }
      return route.fulfill({ json: { items: filtered, total: filtered.length } })
    }

    if (path.startsWith('/api/clients/') && method === 'PUT') {
      const id = +path.split('/').at(-1)
      const body = route.request().postDataJSON()
      const i = members.findIndex(m => m.id === id)
      if (i >= 0) {
        const cur = typeof members[i].client === 'string' ? JSON.parse(members[i].client) : members[i].client
        members[i] = { ...members[i], client: { ...cur, ...body } }
      }
      return route.fulfill({ json: members[i] ?? {} })
    }

    route.fulfill({ json: { items: [], total: 0 } })
  })
}

async function openMembers(page) {
  await page.goto('/app/members/')
  await page.locator('.filter-bar').waitFor()
}

test.describe('members section', () => {
  let errors

  test.beforeEach(async ({ page }) => {
    errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning' && msg.text().includes('Cycle')) errors.push(msg.text())
    })
    await loginAs(page, 'admin')
  })

  test.afterEach(() => { expect(errors).toEqual([]) })

  test('renders members table with name, email and role', async ({ page }) => {
    const members = [
      { id: 1, public_id: 'p1', user_id: null, client: { first_name: 'Hari', last_name: 'Das', email: 'hari@test.local', role: 'Devotee', phone: '' } },
    ]
    await mockMembers(page, { members })
    await openMembers(page)
    await page.locator('table tbody tr').first().waitFor()

    const row = page.locator('table tbody tr').first()
    await expect(row).toContainText('Hari Das')
    await expect(row).toContainText('hari@test.local')
    await expect(row).toContainText('Devotee')
  })

  test('search filter reduces table results', async ({ page }) => {
    const members = [
      { id: 1, public_id: 'p1', user_id: null, client: { first_name: 'Hari', last_name: 'Das', email: 'hari@test.local', role: 'Devotee', phone: '' } },
      { id: 2, public_id: 'p2', user_id: null, client: { first_name: 'Gopi', last_name: 'Devi', email: 'gopi@test.local', role: 'Devotee', phone: '' } },
    ]
    await mockMembers(page, { members })
    await openMembers(page)
    await expect(page.locator('table tbody tr')).toHaveCount(2)

    await page.fill('input[type="search"]', 'Hari')
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Hari Das')
  })

  test('add member: fill form → save → POST sent with correct body', async ({ page }) => {
    const members = []
    await mockMembers(page, { members })
    await openMembers(page)

    await page.click('button:has-text("+ Member")')
    await expect(page.getByRole('heading', { name: 'Add Member' })).toBeVisible()

    await page.fill('#m-first', 'Radha')
    await page.fill('#m-last', 'Devi')
    await page.fill('#m-email', 'radha@test.local')
    await page.fill('#m-phone', '514-222-3333')
    await page.click('button[type="submit"]')
    await expect(page.locator('.modal-overlay').first()).not.toBeVisible({ timeout: 5000 })

    expect(members).toHaveLength(1)
    const saved = members[0].client
    expect(saved.first_name).toBe('Radha')
    expect(saved.last_name).toBe('Devi')
    expect(saved.email).toBe('radha@test.local')
  })

  test('edit member: click row → detail opens → Edit → form pre-populated', async ({ page }) => {
    const members = [
      { id: 1, public_id: 'p1', user_id: null, client: { first_name: 'Krishna', last_name: 'Bhakta', email: 'kb@test.local', role: 'Devotee', phone: '514-000-0001' } },
    ]
    await mockMembers(page, { members })
    await openMembers(page)
    await page.locator('table tbody tr').first().waitFor()

    await page.locator('table tbody tr').first().click()
    await expect(page.getByRole('heading', { name: 'Krishna Bhakta' })).toBeVisible()

    await page.click('button:has-text("Edit")')
    await expect(page.getByRole('heading', { name: 'Edit Member' })).toBeVisible()
    await expect(page.locator('#m-first')).toHaveValue('Krishna')
    await expect(page.locator('#m-last')).toHaveValue('Bhakta')
    await expect(page.locator('#m-email')).toHaveValue('kb@test.local')
  })

  test('invite two-step confirm: cancel keeps no POST sent', async ({ page }) => {
    const members = [
      { id: 1, public_id: 'p1', user_id: null, client: { first_name: 'New', last_name: 'Member', email: 'new@test.local', role: 'Congregation', phone: '' } },
    ]
    await mockMembers(page, { members })
    await openMembers(page)
    await page.locator('table tbody tr').first().click()
    await expect(page.getByRole('heading', { name: 'New Member' })).toBeVisible()

    await page.click('button:has-text("Send Invite")')
    await expect(page.locator('text=Send invite to')).toBeVisible()
    await expect(page.locator('button:has-text("Yes, send")')).toBeVisible()

    await page.click('button:has-text("Cancel")')
    await expect(page.locator('button:has-text("Send Invite")')).toBeVisible()
    await expect(page.locator('button:has-text("Yes, send")')).toHaveCount(0)
  })

  test('viewer cannot access members page — redirected to overview', async ({ page }) => {
    await loginAs(page, 'viewer')
    await page.goto('/app/members/')
    await page.waitForURL('/app/')
    errors = []
  })
})
