// Roles & Permissions UI tests
// FEATURE: roles — admin CRUD + permission toggles

import { test, expect } from '@playwright/test'
import { loginAs, API } from './fixtures.js'

const ALL_PERMS = [
  'income:view', 'income:create',
  'expenses:view', 'expenses:create', 'expenses:approve',
  'members:view', 'members:create', 'members:manage',
  'roles:update',
]

function mockRoles(page, { roles = [] } = {}) {
  let nextId = roles.reduce((m, r) => Math.max(m, r.id), 0) + 1

  return page.route(`${API}/**`, async route => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const path = url.pathname

    if (path === '/api/roles' && method === 'GET') {
      const out = roles.map(r => ({ id: r.id, name: r.name, description: r.description, permissions: [...r.permissions] }))
      return route.fulfill({ json: { roles: out, all_permissions: ALL_PERMS } })
    }

    if (path === '/api/roles' && method === 'POST') {
      const body = route.request().postDataJSON()
      const r = { id: nextId++, name: body.name, description: body.description || '', permissions: body.permissions || [] }
      roles.push(r)
      return route.fulfill({ status: 201, json: { id: r.id, name: r.name, permissions: r.permissions.join(',') } })
    }

    const permMatch = path.match(/^\/api\/roles\/(\d+)\/permissions$/)
    if (permMatch && method === 'PUT') {
      const role = roles.find(r => r.id === +permMatch[1])
      const body = route.request().postDataJSON()
      if (role) {
        if (body.enabled) role.permissions = [...new Set([...role.permissions, body.permission_key])].sort()
        else role.permissions = role.permissions.filter(p => p !== body.permission_key)
      }
      return route.fulfill({ json: { status: 'success', permissions: role?.permissions.join(',') ?? '' } })
    }

    const resetMatch = path.match(/^\/api\/roles\/(\d+)\/reset$/)
    if (resetMatch && method === 'POST') {
      const role = roles.find(r => r.id === +resetMatch[1])
      if (role) role.permissions = [...role.defaultPerms]
      return route.fulfill({ json: { status: 'success', permissions: role?.permissions.join(',') ?? '' } })
    }

    const deleteMatch = path.match(/^\/api\/roles\/(\d+)$/)
    if (deleteMatch && method === 'DELETE') {
      const id = +deleteMatch[1]
      const i = roles.findIndex(r => r.id === id)
      if (i >= 0) roles.splice(i, 1)
      return route.fulfill({ json: { status: 'success' } })
    }

    route.fulfill({ json: {} })
  })
}

function mkRole(id, name, perms, desc = '') {
  return { id, name, description: desc, permissions: [...perms], defaultPerms: [...perms] }
}

/** Locate the badge button for a given action within a perm-row */
function permBadge(container, scope, action) {
  const row = container.locator('.perm-row', { has: container.page().locator('.perm-scope', { hasText: scope }) })
  return row.locator('.perm-check', { hasText: action }).locator('.badge')
}

async function openRoles(page) {
  await page.goto('/app/admin/roles/')
  await page.locator('.card').first().waitFor()
}

test.describe('roles & permissions', () => {
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

  test('renders role cards with grouped permissions', async ({ page }) => {
    const roles = [
      mkRole(1, 'Admin', ['income:view', 'expenses:view', 'members:view'], 'Full access'),
      mkRole(2, 'Viewer', ['income:view'], 'Read only'),
    ]
    await mockRoles(page, { roles })
    await openRoles(page)

    const cards = page.locator('.card')
    await expect(cards).toHaveCount(2)
    await expect(cards.nth(0).locator('h3')).toHaveText('Admin')
    await expect(cards.nth(1).locator('h3')).toHaveText('Viewer')
    await expect(page.locator('.perm-scope').first()).toBeVisible()
  })

  test('admin creates new role via modal', async ({ page }) => {
    const roles = [mkRole(1, 'Existing', ['income:view'])]
    await mockRoles(page, { roles })
    await openRoles(page)

    await page.getByRole('button', { name: '+ Add Role' }).click()
    await page.locator('.modal').waitFor()

    await page.fill('#r-name', 'Pujari')
    await page.fill('#r-desc', 'Temple duties')

    const modal = page.locator('.modal')
    await permBadge(modal, 'Income', 'view').click()

    await page.getByRole('button', { name: 'Create Role' }).click()
    await expect(page.locator('.modal')).toBeHidden()
    await expect(page.locator('.card')).toHaveCount(2)
  })

  test('admin toggles permission on existing role', async ({ page }) => {
    const roles = [mkRole(1, 'Sevaka', ['income:view'])]
    await mockRoles(page, { roles })
    await openRoles(page)

    const card = page.locator('.card').first()
    const badge = permBadge(card, 'Expenses', 'view')

    await expect(badge).not.toHaveClass(/badge-active/)
    await badge.click()
    await expect(badge).toHaveClass(/badge-active/)
  })

  test('admin unchecks permission on existing role', async ({ page }) => {
    const roles = [mkRole(1, 'Sevaka', ['income:view', 'income:create'])]
    await mockRoles(page, { roles })
    await openRoles(page)

    const card = page.locator('.card').first()
    const badge = permBadge(card, 'Income', 'create')

    await expect(badge).toHaveClass(/badge-active/)
    await badge.click()
    await expect(badge).not.toHaveClass(/badge-active/)
  })

  test('admin resets role permissions to defaults', async ({ page }) => {
    const roles = [mkRole(1, 'Sevaka', ['income:view', 'expenses:view'])]
    roles[0].permissions = ['income:view', 'expenses:view', 'members:view']
    await mockRoles(page, { roles })
    await openRoles(page)

    const card = page.locator('.card').first()
    const badge = permBadge(card, 'Members', 'view')

    await expect(badge).toHaveClass(/badge-active/)
    await card.getByRole('button', { name: 'Reset' }).click()
    await expect(badge).not.toHaveClass(/badge-active/)
  })

  test('admin deletes a role', async ({ page }) => {
    const roles = [
      mkRole(1, 'Keep', ['income:view']),
      mkRole(2, 'Remove', ['expenses:view']),
    ]
    await mockRoles(page, { roles })
    await openRoles(page)
    await expect(page.locator('.card')).toHaveCount(2)

    page.on('dialog', d => d.accept())
    await page.locator('.card').nth(1).getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.card')).toHaveCount(1)
    await expect(page.locator('.card h3')).toHaveText('Keep')
  })

  test('delete shows confirm dialog and cancelling preserves role', async ({ page }) => {
    const roles = [mkRole(1, 'Protected', ['income:view'])]
    await mockRoles(page, { roles })
    await openRoles(page)

    page.on('dialog', d => d.dismiss())
    await page.locator('.card').first().getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.card')).toHaveCount(1)
    await expect(page.locator('.card h3')).toHaveText('Protected')
  })

  test('modal closes on backdrop click', async ({ page }) => {
    await mockRoles(page, { roles: [mkRole(1, 'R', [])] })
    await openRoles(page)

    await page.getByRole('button', { name: '+ Add Role' }).click()
    await page.locator('.modal').waitFor()

    await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } })
    await expect(page.locator('.modal')).toBeHidden()
  })

  test('modal closes on X button', async ({ page }) => {
    await mockRoles(page, { roles: [mkRole(1, 'R', [])] })
    await openRoles(page)

    await page.getByRole('button', { name: '+ Add Role' }).click()
    await page.locator('.modal').waitFor()

    await page.locator('.modal-close').click()
    await expect(page.locator('.modal')).toBeHidden()
  })

  test('modify permissions across multiple roles', async ({ page }) => {
    const roles = [
      mkRole(1, 'Role A', ['income:view']),
      mkRole(2, 'Role B', ['expenses:view']),
    ]
    await mockRoles(page, { roles })
    await openRoles(page)

    const cardA = page.locator('.card').nth(0)
    const cardB = page.locator('.card').nth(1)

    const aExp = permBadge(cardA, 'Expenses', 'view')
    await aExp.click()

    const bInc = permBadge(cardB, 'Income', 'view')
    await bInc.click()

    await expect(aExp).toHaveClass(/badge-active/)
    await expect(bInc).toHaveClass(/badge-active/)

    await aExp.click()
    await expect(aExp).not.toHaveClass(/badge-active/)
    await expect(bInc).toHaveClass(/badge-active/)
  })
})
