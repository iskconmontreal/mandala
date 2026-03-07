// Playwright config: JWT rotation tests with 10s token expiry
// FEATURE: tests — short-lived JWT rotation verification

import { defineConfig } from '@playwright/test'

const DIR = '/tmp/goloka-rotation'
const BIN = `${DIR}/goloka`
const GOLOKA = process.cwd() + '/../goloka'
const HASH = "char(36) || '2a' || char(36) || '10' || char(36) || 'NZBaDt9GfmUHN6FYuWtNL.hAMs4ZZy4szhlymPdHY/TIsQZ3/ghxC'"
const ENV = [
  'ENVIRONMENT=development',
  `GOLOKA_PATH=${GOLOKA}`,
  `GOLOKA_PUBLIC_PATH=${GOLOKA}/public`,
  `DB_PATH=${DIR}/app.db`,
  `FINANCE_DB_PATH=${DIR}/fin.db`,
  `COMMUNITY_DB_PATH=${DIR}/community.db`,
  'JWT_SECRET=e2e-test-secret-minimum-32-characters-long',
  'ALLOWED_ORIGINS=http://localhost:4000',
  'PORT=8082',
  'JWT_EXPIRY=10s',
].join(' ')

const BUILD = `cd ${GOLOKA} && CGO_ENABLED=1 go build -tags devtools -o ${BIN} ./cmd/goloka`
const MIGRATE = [
  `sqlite3 ${DIR}/app.db < ${GOLOKA}/internal/migrate/app/001_initial.sql`,
  `sqlite3 ${DIR}/finance.db < ${GOLOKA}/internal/migrate/finance/001_initial.sql`,
  `sqlite3 ${DIR}/community.db < ${GOLOKA}/internal/migrate/community/001_initial.sql`,
].join(' && ')
const BOOTSTRAP_SQL = [
  `INSERT OR REPLACE INTO roles (id, role, permissions, permissions_default) VALUES (1, json_object('name','Administrator','description','Frontend rotation admin'), 'users:view,users:create,members:view,members:create,members:manage,income:view,income:create,expenses:view,expenses:create,expenses:approve,roles:update', 'users:view,users:create,members:view,members:create,members:manage,income:view,income:create,expenses:view,expenses:create,expenses:approve,roles:update');`,
  `DELETE FROM trusted_devices WHERE user_id = 101;`,
  `DELETE FROM user_roles WHERE user_id = 101;`,
  `DELETE FROM users WHERE id = 101 OR email = 'admin@test.local';`,
  `INSERT INTO users (id, public_id, email, password, meta, created_at, updated_at, archived, token_ver, login_attempts) VALUES (101, 'rotation-admin-001', 'admin@test.local', ${HASH}, json_object('name','Admin','email','admin@test.local'), datetime('now'), datetime('now'), 0, 1, 0);`,
  `INSERT OR REPLACE INTO user_roles (user_id, role_id, created_at) VALUES (101, 1, datetime('now'));`,
  `INSERT OR REPLACE INTO trusted_devices (user_id, device_id, label, last_used, created_at) VALUES (101, 'dev-device', 'Dev Machine', datetime('now'), datetime('now'));`,
].join(' ')
const BOOTSTRAP = `sqlite3 ${DIR}/app.db "${BOOTSTRAP_SQL}"`
const SETUP = `rm -rf ${DIR} && mkdir -p ${DIR} && ${BUILD} && ${MIGRATE} && ${BOOTSTRAP} && cd ${DIR} && ${ENV} ${BIN} serve`

export default defineConfig({
  testDir: 'tests',
  testMatch: /rotation\.spec/,
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4000' },
  webServer: [
    {
      command: 'bundle exec jekyll serve',
      url: 'http://localhost:4000',
      reuseExistingServer: true,
    },
    {
      command: SETUP,
      url: 'http://localhost:8082/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
