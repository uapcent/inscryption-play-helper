import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests: whole games played on the built site, served at the same path as GitHub Pages
 * (so the service worker and the base path are tested too). Run with `npm run e2e`.
 */
const BASE = '/inscryption-play-helper/';
const PORT = 5197;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'phone', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    env: { BASE_PATH: BASE },
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
