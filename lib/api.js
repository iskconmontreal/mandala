// api.js — fetch wrapper for Goloka backend

import { auth } from './auth.js'

const BASE = localStorage.getItem('mandala_api') || 'https://api.iskconmontreal.ca'

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })

  if (res.status === 401) {
    auth.clear()
    auth.guard()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  get:  (path)       => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del:  (path)       => request(path, { method: 'DELETE' }),

  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  googleUrl: () => request('/auth/google'),
}
