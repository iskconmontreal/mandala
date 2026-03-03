// Real auth helpers for E2E tests against live goloka sandbox
// FEATURE: tests — E2E login with real JWT via trusted device

const API = 'http://localhost:8080'
const DEVICE = 'e2e-device'

const CREDS = {
  admin:     { email: 'admin@test.local',     password: 'test123' },
  treasurer: { email: 'treasurer@test.local', password: 'test123' },
  viewer:    { email: 'viewer@test.local',    password: 'test123' },
}

export async function loginAsReal(page, role = 'admin') {
  const { email, password } = CREDS[role]
  const res = await page.request.post(`${API}/auth/login`, {
    data: { email, password, device_id: DEVICE, device_label: 'E2E Test' },
  })
  const { token, user } = await res.json()
  await page.addInitScript(([t, u, api]) => {
    localStorage.setItem('mandala_token', t)
    localStorage.setItem('mandala_user', JSON.stringify(u))
    localStorage.setItem('mandala_api', api)
  }, [token, user, API])
}
