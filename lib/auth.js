// auth.js — token management + route guard

const TOKEN_KEY = 'mandala_token'
const USER_KEY = 'mandala_user'

// Resolve path relative to site root (works from any subdirectory)
const base = new URL('..', import.meta.url).pathname

export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY) },
  get user() { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } },

  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  get active() { return !!this.token },

  // Redirect to login if not authenticated
  guard() {
    if (!this.active) {
      window.location.href = base + 'index.html'
      return false
    }
    return true
  },

  // Capture token from URL fragment (after OAuth redirect)
  capture() {
    const hash = window.location.hash
    if (!hash) return false
    const params = new URLSearchParams(hash.slice(1))
    const token = params.get('token')
    const user = params.get('user')
    if (token) {
      this.save(token, user ? JSON.parse(decodeURIComponent(user)) : null)
      history.replaceState(null, '', window.location.pathname)
      return true
    }
    return false
  },

  logout() {
    this.clear()
    window.location.href = base + 'index.html'
  }
}
