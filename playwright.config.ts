import { defineConfig, devices } from '@playwright/test';

/**
 * FibreFlow Playwright Configuration
 * E2E and UI testing for the React application
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: false, // Run sequentially for contractors tests to avoid conflicts

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: 1, // Single worker to avoid database conflicts

  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/e2e-results/html' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3005',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Run in headless mode for faster tests (set to false for debugging)
    headless: true,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  // Note: Use PORT=3005 npm start (production mode) as recommended in CLAUDE.md
  webServer: {
    command: 'PORT=3005 npm start',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  // Test timeout
  timeout: 60 * 1000, // 60 seconds for E2E tests

  // Expect timeout
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },

  // Output directory for test results
  outputDir: 'tests/e2e-results/',
});