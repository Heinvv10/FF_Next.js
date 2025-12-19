// tests/e2e/ticketing/ticket-lifecycle.spec.ts
// E2E tests for complete ticket lifecycle workflows
import { test, expect } from '@playwright/test';

test.describe('Ticket Lifecycle - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ticketing dashboard
    await page.goto('/ticketing');

    // Wait for authentication redirect if needed
    await page.waitForLoadState('networkidle');
  });

  test('should create and manage ticket through complete lifecycle', async ({ page }) => {
    // Step 1: Create new ticket
    await test.step('Create new ticket', async () => {
      await page.click('button:has-text("New Ticket")');

      await page.fill('input[name="title"]', 'E2E Test Ticket - Installation Issue');
      await page.fill('textarea[name="description"]', 'Customer reports installation delay at LAWLEY001');
      await page.selectOption('select[name="priority"]', 'high');
      await page.selectOption('select[name="source"]', 'qcontact');

      await page.click('button:has-text("Create Ticket")');

      // Wait for success message
      await expect(page.locator('text=Ticket created successfully')).toBeVisible();

      // Verify ticket appears in list
      await expect(page.locator('text=E2E Test Ticket - Installation Issue')).toBeVisible();
    });

    // Step 2: Assign ticket
    await test.step('Assign ticket to user', async () => {
      await page.click('text=E2E Test Ticket - Installation Issue');

      await page.click('button:has-text("Assign")');
      await page.selectOption('select[name="assigned_to"]', { index: 1 }); // Select first available user
      await page.click('button:has-text("Save Assignment")');

      await expect(page.locator('text=Ticket assigned successfully')).toBeVisible();

      // Verify assignment shows in ticket details
      await expect(page.locator('.ticket-assignee')).toBeVisible();
    });

    // Step 3: Add note/comment
    await test.step('Add note to ticket', async () => {
      await page.fill('textarea[name="note_content"]', 'Contacted customer, will visit site tomorrow');
      await page.click('button:has-text("Add Note")');

      await expect(page.locator('text=Note added successfully')).toBeVisible();
      await expect(page.locator('text=Contacted customer, will visit site tomorrow')).toBeVisible();
    });

    // Step 4: Update status to in_progress
    await test.step('Update status to in progress', async () => {
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'in_progress');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('text=Status updated successfully')).toBeVisible();

      // Verify status badge updated
      await expect(page.locator('.status-badge:has-text("In Progress")')).toBeVisible();
    });

    // Step 5: Add attachment
    await test.step('Upload attachment', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-screenshot.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-data'),
      });

      await page.click('button:has-text("Upload")');

      await expect(page.locator('text=Attachment uploaded successfully')).toBeVisible();
      await expect(page.locator('text=test-screenshot.png')).toBeVisible();
    });

    // Step 6: Update priority
    await test.step('Change priority to critical', async () => {
      await page.click('button:has-text("Edit Priority")');
      await page.selectOption('select[name="priority"]', 'critical');
      await page.click('button:has-text("Save Priority")');

      await expect(page.locator('text=Priority updated successfully')).toBeVisible();
      await expect(page.locator('.priority-badge:has-text("Critical")')).toBeVisible();
    });

    // Step 7: Resolve ticket
    await test.step('Resolve ticket', async () => {
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'resolved');
      await page.fill('textarea[name="resolution_note"]', 'Installation completed successfully');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('text=Status updated successfully')).toBeVisible();
      await expect(page.locator('.status-badge:has-text("Resolved")')).toBeVisible();
      await expect(page.locator('text=Installation completed successfully')).toBeVisible();
    });

    // Step 8: Close ticket
    await test.step('Close ticket', async () => {
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'closed');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('text=Status updated successfully')).toBeVisible();
      await expect(page.locator('.status-badge:has-text("Closed")')).toBeVisible();
    });

    // Step 9: Verify ticket history
    await test.step('Verify activity history', async () => {
      await page.click('text=Activity History');

      // Verify all major actions are logged
      await expect(page.locator('text=Ticket created')).toBeVisible();
      await expect(page.locator('text=Assigned to')).toBeVisible();
      await expect(page.locator('text=Status changed to in_progress')).toBeVisible();
      await expect(page.locator('text=Priority changed to critical')).toBeVisible();
      await expect(page.locator('text=Status changed to resolved')).toBeVisible();
      await expect(page.locator('text=Status changed to closed')).toBeVisible();
    });
  });

  test('should handle SLA escalation workflow', async ({ page }) => {
    await test.step('Create high-priority ticket', async () => {
      await page.click('button:has-text("New Ticket")');

      await page.fill('input[name="title"]', 'SLA Test - Critical Issue');
      await page.fill('textarea[name="description"]', 'Network outage affecting multiple sites');
      await page.selectOption('select[name="priority"]', 'critical');

      await page.click('button:has-text("Create Ticket")');

      await expect(page.locator('text=Ticket created successfully')).toBeVisible();
    });

    await test.step('Verify SLA countdown visible', async () => {
      await page.click('text=SLA Test - Critical Issue');

      // Check for SLA timer/indicator
      await expect(page.locator('.sla-countdown')).toBeVisible();

      // Verify time remaining is displayed
      await expect(page.locator('text=/\\d+h \\d+m remaining/')).toBeVisible();
    });

    await test.step('Verify SLA warning on nearing deadline', async () => {
      // Check for warning indicator (might need to wait or mock time)
      const slaWarning = page.locator('.sla-warning');
      if (await slaWarning.isVisible()) {
        expect(await slaWarning.textContent()).toContain('SLA at risk');
      }
    });
  });

  test('should bulk update multiple tickets', async ({ page }) => {
    const ticketTitles = [
      'Bulk Test 1',
      'Bulk Test 2',
      'Bulk Test 3',
    ];

    await test.step('Create multiple test tickets', async () => {
      for (const title of ticketTitles) {
        await page.click('button:has-text("New Ticket")');
        await page.fill('input[name="title"]', title);
        await page.fill('textarea[name="description"]', `Description for ${title}`);
        await page.click('button:has-text("Create Ticket")');
        await page.waitForTimeout(500); // Brief pause between creates
      }
    });

    await test.step('Select multiple tickets', async () => {
      // Navigate back to list
      await page.goto('/ticketing');

      // Select checkboxes for bulk test tickets
      for (const title of ticketTitles) {
        await page.click(`tr:has-text("${title}") input[type="checkbox"]`);
      }

      // Verify selection count
      await expect(page.locator('text=3 tickets selected')).toBeVisible();
    });

    await test.step('Bulk update status', async () => {
      await page.click('button:has-text("Bulk Actions")');
      await page.click('text=Update Status');
      await page.selectOption('select[name="bulk_status"]', 'in_progress');
      await page.click('button:has-text("Apply")');

      await expect(page.locator('text=3 tickets updated successfully')).toBeVisible();
    });

    await test.step('Verify bulk update applied', async () => {
      for (const title of ticketTitles) {
        const row = page.locator(`tr:has-text("${title}")`);
        await expect(row.locator('.status-badge:has-text("In Progress")')).toBeVisible();
      }
    });
  });

  test('should filter and search tickets', async ({ page }) => {
    await test.step('Filter by status', async () => {
      await page.selectOption('select[name="filter_status"]', 'open');

      // Verify only open tickets shown
      const rows = page.locator('tbody tr');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator('.status-badge:has-text("Open")')).toBeVisible();
      }
    });

    await test.step('Filter by priority', async () => {
      await page.selectOption('select[name="filter_priority"]', 'high');

      const rows = page.locator('tbody tr');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const badge = rows.nth(i).locator('.priority-badge');
        const text = await badge.textContent();
        expect(text).toMatch(/(High|Critical)/);
      }
    });

    await test.step('Search by keyword', async () => {
      await page.fill('input[name="search"]', 'installation');
      await page.press('input[name="search"]', 'Enter');

      // Wait for results
      await page.waitForLoadState('networkidle');

      // Verify results contain search term
      const rows = page.locator('tbody tr');
      const count = await rows.count();

      if (count > 0) {
        const firstRow = rows.first();
        const text = await firstRow.textContent();
        expect(text?.toLowerCase()).toContain('installation');
      }
    });

    await test.step('Combine filters', async () => {
      await page.selectOption('select[name="filter_status"]', 'open');
      await page.selectOption('select[name="filter_priority"]', 'high');
      await page.fill('input[name="search"]', 'network');
      await page.press('input[name="search"]', 'Enter');

      await page.waitForLoadState('networkidle');

      // Verify all filters applied
      const rows = page.locator('tbody tr');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(row.locator('.status-badge:has-text("Open")')).toBeVisible();
      }
    });

    await test.step('Clear filters', async () => {
      await page.click('button:has-text("Clear Filters")');

      // Verify filters reset
      await expect(page.locator('select[name="filter_status"]')).toHaveValue('');
      await expect(page.locator('select[name="filter_priority"]')).toHaveValue('');
      await expect(page.locator('input[name="search"]')).toHaveValue('');
    });
  });

  test('should export tickets to CSV', async ({ page }) => {
    await test.step('Navigate to export', async () => {
      await page.click('button:has-text("Export")');
    });

    await test.step('Configure export options', async () => {
      await page.selectOption('select[name="export_format"]', 'csv');
      await page.click('input[name="include_closed"]'); // Uncheck
      await page.click('button:has-text("Download")');
    });

    await test.step('Verify download started', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Download")');

      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/tickets_.*\.csv/);
    });
  });

  test('should handle validation errors', async ({ page }) => {
    await test.step('Try to create ticket without required fields', async () => {
      await page.click('button:has-text("New Ticket")');

      // Leave title empty
      await page.fill('textarea[name="description"]', 'Some description');
      await page.click('button:has-text("Create Ticket")');

      // Verify validation error
      await expect(page.locator('text=Title is required')).toBeVisible();
    });

    await test.step('Try to submit empty note', async () => {
      // Navigate to any existing ticket
      await page.goto('/ticketing');
      await page.click('tbody tr:first-child');

      // Try to submit empty note
      await page.click('button:has-text("Add Note")');

      await expect(page.locator('text=Note content is required')).toBeVisible();
    });

    await test.step('Try invalid status transition', async () => {
      // Try to close ticket without resolving first (if business rule enforces this)
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'closed');

      const errorMessage = page.locator('text=/Cannot close.*without resolving/');
      if (await errorMessage.isVisible()) {
        expect(await errorMessage.textContent()).toContain('resolve');
      }
    });
  });
});
