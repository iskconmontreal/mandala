// app.js — shared app shell init (DRY: every page needs this)

import sprae from './sprae.js'
import { auth } from './auth.js'

auth.capture()

const page = location.pathname.split('/').pop() || 'index.html'

// Categories — single source of truth
export const DON_CATS = ['General', 'Sunday Feast', 'Book Distribution', 'Deity Worship', 'Building Fund', 'Annadana', 'Festival', 'Other']
export const EXP_CATS = ['Utilities', 'Kitchen', 'Deity', 'Maintenance', 'Office', 'Rent', 'Insurance', 'Travel', 'Other']

// Shared shell state every page needs
const shell = () => ({
  user: auth.user,
  active: (href) => href === page,
  logout: () => auth.logout(),
  userMenu: false,
})

// Init app with page-specific state merged into shell
export function init(state = {}) {
  return sprae(document.getElementById('app'), { ...shell(), ...state })
}

export { auth }
