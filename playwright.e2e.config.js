// Playwright E2E config: real goloka sandbox + Jekyll frontend
// FEATURE: tests — full-stack E2E test runner

import { defineConfig } from '@playwright/test'

const DIR = '/tmp/goloka-e2e'
const ENV = `ENVIRONMENT=development APP_DB_PATH=${DIR}/app.db FINANCE_DB_PATH=${DIR}/fin.db`

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: 'http://localhost:4000' },
  webServer: [
    {
      command: 'bundle exec jekyll serve',
      url: 'http://localhost:4000',
      reuseExistingServer: true,
    },
    {
      command: `rm -rf ${DIR} && mkdir -p ${DIR} && ${ENV} goloka seed && ${ENV} goloka serve`,
      url: 'http://localhost:8080/api/health',
      reuseExistingServer: false,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
