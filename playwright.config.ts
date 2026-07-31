import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Some CI images ship a Chromium build that doesn't match the one this
 * Playwright version would download. Point at it when it's there; otherwise
 * fall back to Playwright's own browser (`npx playwright install chromium`).
 */
const preinstalledChromium = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
].find((p): p is string => Boolean(p) && existsSync(p!));

/**
 * Tests run against a production build served by `vite preview`, so they cover
 * what actually ships (including code-split chunks) rather than the dev server.
 *
 * The app runs in demo mode here — no Supabase env vars — so the suite is
 * self-contained and needs no database.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: preinstalledChromium ? { executablePath: preinstalledChromium } : {},
      },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
