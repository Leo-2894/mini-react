import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'npm run dev', url: 'http://127.0.0.1:4173/phase1/', reuseExistingServer: false, timeout: 15000 },
    { command: 'node tests/fixtures/server.js', url: 'http://127.0.0.1:4174/echo', reuseExistingServer: false, timeout: 15000 }
  ],
});
