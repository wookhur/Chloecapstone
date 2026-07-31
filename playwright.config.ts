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

const chrome = {
  ...devices['Desktop Chrome'],
  launchOptions: preinstalledChromium ? { executablePath: preinstalledChromium } : {},
};

/**
 * Tests run against a production build served by `vite preview`, so they cover
 * what actually ships (including code-split chunks) rather than the dev server.
 *
 * Two builds, because whether sign-in exists is decided at build time by the
 * Supabase env vars:
 *
 *   :4173  demo mode — no env vars, account switcher, no login. Most tests.
 *   :4174  configured — sign-in gate in front of everything (tests/auth.spec.ts).
 *          The Supabase URL points at a closed port: these tests are about the
 *          gate being there, not about talking to a real project.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',

  use: { trace: 'on-first-retry' },

  projects: [
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/,
      use: { ...chrome, baseURL: 'http://localhost:4173' },
    },
    {
      name: 'signed-in',
      testMatch: /auth\.spec\.ts/,
      use: { ...chrome, baseURL: 'http://localhost:4174' },
    },
  ],

  webServer: [
    {
      command: 'npm run build && npm run preview -- --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        'VITE_SUPABASE_URL=http://127.0.0.1:9999 VITE_SUPABASE_ANON_KEY=test-anon-key ' +
        'npx vite build --outDir dist-auth && npx vite preview --outDir dist-auth --port 4174',
      url: 'http://localhost:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
