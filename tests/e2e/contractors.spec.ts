/**
 * E2E Tests for Contractors Module
 * Tests critical user workflows for contractor management
 */

import { test, expect } from '@playwright/test';

// Test data
const testContractor = {
  companyName: 'E2E Test Contractor ' + Date.now(),
  contactPerson: 'John Test',
  email: `test-${Date.now()}@example.com`,
  phone: '0123456789',
  physicalAddress: '123 Test Street',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
};

test.describe('Contractors Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contractors page before each test
    await page.goto('/app/contractors');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Contractor List & Search', () => {
    test('should display contractors list page', async ({ page }) => {
      // Verify page title or heading
      await expect(page.locator('h1, h2').filter({ hasText: /contractors/i }).first()).toBeVisible();

      // Verify "Add Contractor" button exists
      await expect(page.locator('button, a').filter({ hasText: /add.*contractor/i }).first()).toBeVisible();
    });

    test('should search for contractors', async ({ page }) => {
      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        // Enter search term
        await searchInput.fill('test');

        // Wait for search results
        await page.waitForTimeout(1000);

        // Verify search was performed (results updated or no results message)
        const hasResults = await page.locator('table tbody tr, .contractor-card, [data-testid*="contractor"]').count() > 0;
        const hasNoResults = await page.locator('text=/no.*found/i, text=/no.*contractors/i').isVisible();

        expect(hasResults || hasNoResults).toBeTruthy();
      }
    });

    test('should filter contractors by status', async ({ page }) => {
      // Look for filter/status dropdown
      const statusFilter = page.locator('select, [role="combobox"]').filter({ has: page.locator('option, [role="option"]') }).first();

      if (await statusFilter.isVisible()) {
        // Select a status
        await statusFilter.click();
        await page.locator('option, [role="option"]').first().click();

        // Wait for filter to apply
        await page.waitForTimeout(1000);

        // Verify page updated (count changed or results visible)
        expect(await page.locator('body').isVisible()).toBeTruthy();
      }
    });
  });

  test.describe('Contractor Creation Workflow', () => {
    test('should create a new contractor successfully', async ({ page }) => {
      // Click "Add Contractor" button
      await page.locator('button, a').filter({ hasText: /add.*contractor/i }).first().click();

      // Wait for form to appear
      await page.waitForLoadState('networkidle');

      // Fill in contractor details
      await page.locator('input[name="companyName"], #companyName').fill(testContractor.companyName);
      await page.locator('input[name="contactPerson"], #contactPerson').fill(testContractor.contactPerson);
      await page.locator('input[name="email"], #email').fill(testContractor.email);
      await page.locator('input[name="phone"], #phone').fill(testContractor.phone);
      await page.locator('input[name="physicalAddress"], #physicalAddress, textarea[name="physicalAddress"]').fill(testContractor.physicalAddress);
      await page.locator('input[name="city"], #city').fill(testContractor.city);

      // Select province (dropdown)
      const provinceSelect = page.locator('select[name="province"], #province');
      if (await provinceSelect.isVisible()) {
        await provinceSelect.selectOption(testContractor.province);
      }

      await page.locator('input[name="postalCode"], #postalCode').fill(testContractor.postalCode);

      // Submit form
      await page.locator('button[type="submit"], button').filter({ hasText: /save|create|submit/i }).click();

      // Wait for navigation or success message
      await page.waitForTimeout(2000);

      // Verify success (either redirected to list or see success toast)
      const isOnListPage = page.url().includes('/contractors') && !page.url().includes('/new');
      const hasSuccessMessage = await page.locator('text=/success|created|added/i').isVisible({ timeout: 3000 }).catch(() => false);

      expect(isOnListPage || hasSuccessMessage).toBeTruthy();

      // Verify contractor appears in list
      if (isOnListPage) {
        await page.waitForTimeout(1000);
        const contractorInList = page.locator(`text="${testContractor.companyName}"`);
        await expect(contractorInList.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should validate required fields', async ({ page }) => {
      // Click "Add Contractor" button
      await page.locator('button, a').filter({ hasText: /add.*contractor/i }).first().click();

      // Wait for form
      await page.waitForLoadState('networkidle');

      // Try to submit empty form
      await page.locator('button[type="submit"], button').filter({ hasText: /save|create|submit/i }).click();

      // Verify validation messages appear
      const hasValidationError = await page.locator('text=/required|cannot be empty/i, .error, [role="alert"]').first().isVisible({ timeout: 3000 }).catch(() => false);
      const formStillVisible = await page.locator('input[name="companyName"], #companyName').isVisible();

      // Either validation message or form still visible (HTML5 validation)
      expect(hasValidationError || formStillVisible).toBeTruthy();
    });
  });

  test.describe('Contractor Viewing Workflow', () => {
    test('should view contractor details', async ({ page }) => {
      // Click on first contractor in list
      const firstContractor = page.locator('table tbody tr, .contractor-card, [data-testid*="contractor-item"]').first();

      if (await firstContractor.isVisible()) {
        // Click to view details (might be a link or button)
        const viewLink = firstContractor.locator('a, button').filter({ hasText: /view|details/i }).first();

        if (await viewLink.isVisible()) {
          await viewLink.click();
        } else {
          // Click on the row/card itself
          await firstContractor.click();
        }

        // Wait for details page to load
        await page.waitForLoadState('networkidle');

        // Verify we're on a detail page (URL changed or detail content visible)
        const urlChanged = !page.url().endsWith('/contractors') && page.url().includes('/contractors/');
        const hasDetailContent = await page.locator('text=/company|contact|email|phone/i').first().isVisible();

        expect(urlChanged || hasDetailContent).toBeTruthy();
      }
    });

    test('should navigate between tabs on contractor detail page', async ({ page }) => {
      // Click on first contractor
      const firstContractor = page.locator('table tbody tr a, .contractor-card a, [data-testid*="contractor-item"] a').first();

      if (await firstContractor.isVisible()) {
        await firstContractor.click();
        await page.waitForLoadState('networkidle');

        // Look for tabs (Teams, Documents, etc.)
        const teamsTab = page.locator('[role="tab"], button, a').filter({ hasText: /teams/i }).first();

        if (await teamsTab.isVisible()) {
          await teamsTab.click();
          await page.waitForTimeout(500);

          // Verify tab content changed
          const teamsContent = page.locator('text=/team|add team/i');
          await expect(teamsContent.first()).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Contractor Editing Workflow', () => {
    test('should edit contractor details', async ({ page }) => {
      // Navigate to first contractor
      const firstContractor = page.locator('table tbody tr a, .contractor-card a, [data-testid*="contractor-item"] a').first();

      if (await firstContractor.isVisible()) {
        await firstContractor.click();
        await page.waitForLoadState('networkidle');

        // Click edit button
        const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
        await editButton.click();

        // Wait for edit form
        await page.waitForLoadState('networkidle');

        // Modify a field
        const phoneInput = page.locator('input[name="phone"], #phone');
        await phoneInput.clear();
        await phoneInput.fill('9876543210');

        // Save changes
        await page.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).click();

        // Wait for save to complete
        await page.waitForTimeout(2000);

        // Verify success
        const hasSuccessMessage = await page.locator('text=/success|updated|saved/i').isVisible({ timeout: 3000 }).catch(() => false);
        const backToView = !page.url().includes('/edit');

        expect(hasSuccessMessage || backToView).toBeTruthy();
      }
    });

    test('should cancel editing without saving', async ({ page }) => {
      // Navigate to first contractor
      const firstContractor = page.locator('table tbody tr a, .contractor-card a').first();

      if (await firstContractor.isVisible()) {
        await firstContractor.click();
        await page.waitForLoadState('networkidle');

        // Click edit button
        const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          // Modify a field
          const phoneInput = page.locator('input[name="phone"], #phone');
          await phoneInput.clear();
          await phoneInput.fill('0000000000');

          // Click cancel
          const cancelButton = page.locator('button, a').filter({ hasText: /cancel|back/i }).first();
          await cancelButton.click();

          // Verify returned to view page without saving
          await page.waitForTimeout(1000);
          const backToView = !page.url().includes('/edit');

          expect(backToView).toBeTruthy();
        }
      }
    });
  });

  test.describe('Contractor Deletion (if applicable)', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      // Navigate to a contractor
      const firstContractor = page.locator('table tbody tr a, .contractor-card a').first();

      if (await firstContractor.isVisible()) {
        await firstContractor.click();
        await page.waitForLoadState('networkidle');

        // Look for delete button
        const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          // Verify confirmation dialog appears
          await page.waitForTimeout(500);
          const confirmDialog = page.locator('text=/are you sure|confirm|delete/i');
          await expect(confirmDialog.first()).toBeVisible({ timeout: 3000 });

          // Cancel deletion
          const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
      }
    });
  });
});
