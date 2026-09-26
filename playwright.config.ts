import { defineConfig } from '@playwright/test';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export default defineConfig({
  testDir: './tests/e2e/audio-steps',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1, // Sequential execution for isolated, reproducible audio hardware tests
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/audio_steps_results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    viewport: { width: 1280, height: 800 },
    permissions: ['microphone'],
    actionTimeout: 10000,
    trace: 'retain-on-failure',
    screenshot: 'on',
    serviceWorkers: 'block',
    launchOptions: {
      executablePath: CHROME_PATH,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--allow-file-access-from-files',
      ],
    },
  },
});
