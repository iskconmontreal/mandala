// app.js — shared app shell init (DRY: every page needs this)

import sprae from './sprae.js'
import { auth } from './auth.js'

auth.capture()

const page = location.pathname.split('/').pop() || 'index.html'
const FINANCE = new Set(['index.html', 'donations.html', 'expenses.html'])
const section = FINANCE.has(page) ? 'finance' : page.replace('.html', '')

// Categories — single source of truth
export const DON_CATS = ['General', 'Sunday Feast', 'Book Distribution', 'Deity Worship', 'Building Fund', 'Annadana', 'Festival', 'Other']
export const EXP_CATS = ['Utilities', 'Kitchen', 'Deity', 'Maintenance', 'Office', 'Rent', 'Insurance', 'Travel', 'Other']

// Member roles & statuses
export const ROLES = ['Devotee', 'Volunteer', 'Board Member', 'Treasurer', 'President', 'Other']
export const STATUSES = ['Active', 'Inactive']

// Init app with page-specific state merged into shell
export function init(state = {}) {
  state.user = auth.user
  state.section = section
  state.active = (s) => s === section
  state.tab = (p) => p === page
  state.logout = () => auth.logout()
  state.userMenu ??= false
  return sprae(document, state)
}

export { auth }
