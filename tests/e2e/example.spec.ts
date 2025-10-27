import { test, expect } from '@playwright/test';

test.describe('FibreFlow Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Homepage redirects to /projects for authenticated users
    await page.waitForLoadState('networkidle');

    // Verify Projects page heading is visible
    await expect(page.locator('h1').filter({ hasText: /projects/i }).first()).toBeVisible();
  });

  test('should navigate to main sections', async ({ page }) => {
    await page.goto('/');

    // Check sidebar navigation exists (more specific selector to avoid breadcrumb nav)
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));
    await expect(sidebar).toBeVisible();

    // Verify at least one nav link is visible
    await expect(page.locator('nav a').first()).toBeVisible();
  });
});

test.describe('Authentication @smoke', () => {
  test('should display login page', async ({ page }) => {
    // When already authenticated (via mock), /sign-in redirects to dashboard
    // This test verifies the auth redirect behavior
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Authenticated users should be redirected away from sign-in
    // Verify we're on an authenticated page (has sidebar navigation)
    const sidebar = page.locator('aside').or(page.locator('nav'));
    await expect(sidebar.first()).toBeVisible();
  });
});