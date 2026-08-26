import { defineConfig, devices } from '@playwright/test';

/**
 * Ende-zu-Ende-Tests.
 *
 * `channel: 'chrome'` benutzt das installierte Chrome statt eine eigene
 * Chromium-Kopie herunterzuladen — spart rund 150 MB und testet nebenbei in
 * dem Browser, den die Nutzer wirklich haben.
 *
 * Die Tests laufen im Gastmodus. Das ist Absicht: so brauchen sie keine
 * Supabase-Anmeldung, kein Testkonto und keine Netzverbindung, und sie prüfen
 * trotzdem den kompletten Ablauf vom Maß bis zum gespeicherten Outfit.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5183',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1000 } },
    },
  ],

  // Läuft der Dev-Server schon, wird er mitbenutzt statt ein zweiter gestartet.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5183',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
