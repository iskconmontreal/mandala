// Fetch wrapper for Goloka REST backend
// FEATURE: api — all HTTP communication

import { auth } from './auth.js'

export const BASE = localStorage.getItem('mandala_api') || 'https://api.iskconmontreal.ca'

async function request(path, opts = {}) {
  const headers = { ...opts.headers }
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })

  if (res.status === 401 && auth.token) {
    auth.clear()
    auth.guard()
  }

  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json') && res.status !== 204) {
    throw new Error(res.ok ? `Route not found: ${path}` : res.statusText)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || res.statusText)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  get:  path        => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body) }),
  del:  path        => request(path, { method: 'DELETE' }),

  login:     (email, password, device_id, device_label) => api.post('/auth/login',      { email, password, device_id, device_label }),
  verifyOtp: (email, otp, device_id, device_label)      => api.post('/auth/verify-otp', { email, otp, device_id, device_label }),
  googleUrl: () => api.get('/auth/google'),

  getUsers:       p    => api.get(`/api/users?${new URLSearchParams(p)}`),
  getUser:        id   => api.get(`/api/users/${id}`),
  createUser:     data => api.post('/api/users', data),
  updateUser:     (id, d) => api.put(`/api/users/${id}`, d),
  getRoles:       ()   => api.get('/api/roles'),
  revokeDevice:   id   => api.del(`/api/users/${id}/device`),
  getMyDevices:   ()   => api.get('/api/me/devices'),
  revokeMyDevice: id   => api.del(`/api/me/devices/${id}`),

  getMembers:    p    => api.get(`/api/clients?${new URLSearchParams(p)}`),
  getMember:     id   => api.get(`/api/clients/${id}`),
  createMember:  data => api.post('/api/clients', data),
  updateMember:  (id, d) => api.put(`/api/clients/${id}`, d),
  archiveMember: id   => api.del(`/api/clients/${id}`),
  inviteMember:  id   => api.post(`/api/clients/${id}/invite`),

  getDonations:   p    => api.get(`/api/donations?${new URLSearchParams(p)}`),
  createDonation: data => api.post('/api/donations', data),
  updateDonation: (id, d) => api.put(`/api/donations/${id}`, d),
  deleteDonation: id   => api.del(`/api/donations/${id}`),

  extractDoc: file => {
    const form = new FormData()
    form.append('file', file)
    return request('/api/documents/extract', { method: 'POST', body: form })
  },

  getExpenses:     p    => api.get(`/api/expenses?${new URLSearchParams(p)}`),
  createExpense:   data => api.post('/api/expenses', data),
  updateExpense:   (id, d) => api.put(`/api/expenses/${id}`, d),
  deleteExpense:   id   => api.del(`/api/expenses/${id}`),

  submitExpense:    id        => api.post(`/api/expenses/${id}/submit`),
  approveExpense:   (id, note) => api.post(`/api/expenses/${id}/approve`, { note }),
  returnExpense:    (id, note) => api.post(`/api/expenses/${id}/return`,  { note }),
  rejectExpense:    (id, note) => api.post(`/api/expenses/${id}/reject`,  { note }),
  payExpense:       (id, ref)  => api.post(`/api/expenses/${id}/pay`,     { bank_ref: ref }),
  reconcileExpense: (id, amt)  => api.post(`/api/expenses/${id}/reconcile`, { actual_amount: amt }),
  closeExpense:     (id, ref)  => api.post(`/api/expenses/${id}/close`,   { bank_ref: ref }),
  getExpenseApprovals: id      => api.get(`/api/expenses/${id}/approvals`),

  getMyDonations:       p    => api.get(`/api/me/donations?${new URLSearchParams(p)}`),
  getMyDonationSummary: year => api.get(`/api/me/donations/summary?year=${year}`),
  getMyTaxReceipts:     ()   => api.get('/api/me/tax-receipts'),
  getAuditLogs:         p    => api.get(`/api/audit?${new URLSearchParams(p)}`),
}
