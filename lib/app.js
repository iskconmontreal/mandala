// app.js — shared app shell init (DRY: every page needs this)

import sprae from './sprae.js'
import { auth } from './auth.js'

auth.capture()
if (!auth.guard()) throw new Error('redirecting')

const page = location.pathname.split('/').pop() || 'index.html'
const section = page.replace('.html', '') || 'index'

// Categories — match backend validation values
export const DON_CATS = ['general', 'sunday_feast', 'book_distribution', 'deity_worship', 'building_fund', 'annadana', 'festival', 'other']
export const EXP_CATS = ['utilities', 'kitchen', 'deity', 'maintenance', 'office', 'rent', 'insurance', 'travel', 'other']
export const DON_METHODS = ['cash', 'cheque', 'e-transfer', 'card', 'in-kind']
export const fmtCat = s => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'

// Member roles & statuses
export const ROLES = ['Devotee', 'Volunteer', 'Board Member', 'Treasurer', 'President', 'Other']

// Init app with page-specific state merged into shell
export function init(state = {}) {
  state.user = auth.user
  state.section = section
  state.active = (s) => s === section
  state.tab = (p) => p === page
  state.logout = () => auth.logout()
  state.can = (p) => auth.can(p)
  state.userMenu ??= false
  return sprae(document, state)
}

export { auth }
