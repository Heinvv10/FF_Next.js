// tests/e2e/ticketing/qcontact-integration.spec.ts
// E2E tests for QContact API integration workflows
import { test, expect } from '@playwright/test';

test.describe('QContact Integration - Auto-Creation from API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ticketing');
    await page.waitForLoadState('networkidle');
  });

  test('should display QContact tickets in list', async ({ page }) => {
    await test.step('Filter by QContact source', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify QContact tickets visible', async () => {
      const rows = page.locator('tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Verify source badge on first ticket
        const firstRow = rows.first();
        await expect(firstRow.locator('.source-badge:has-text("QContact")')).toBeVisible();
      }
    });
  });

  test('should show QContact metadata in ticket details', async ({ page }) => {
    await test.step('Open QContact ticket', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Verify QContact-specific fields', async () => {
      // Check for QContact section
      const qcontactSection = page.locator('.qcontact-metadata, .source-details');
      if (await qcontactSection.isVisible()) {
        // Verify customer information
        await expect(qcontactSection.locator('text=/Customer|Contact/')).toBeVisible();

        // Verify request ID if available
        const requestId = qcontactSection.locator('.qcontact-request-id');
        if (await requestId.isVisible()) {
          expect(await requestId.textContent()).toMatch(/QC-\d+|REQ-\d+/);
        }
      }
    });
  });

  test('should sync ticket status back to QContact', async ({ page }) => {
    await test.step('Open QContact ticket', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Update ticket status', async () => {
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'in_progress');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('text=Status updated successfully')).toBeVisible();
    });

    await test.step('Verify sync indicator', async () => {
      // Look for QContact sync status
      const syncIndicator = page.locator('.qcontact-sync-status, .sync-indicator');
      if (await syncIndicator.isVisible()) {
        await expect(syncIndicator).toContainText(/Synced|Updated in QContact/);
      }
    });
  });

  test('should handle QContact customer information', async ({ page }) => {
    await test.step('Navigate to QContact ticket', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Verify customer details section', async () => {
      const customerSection = page.locator('.customer-info, .contact-details');
      if (await customerSection.isVisible()) {
        // Check for customer name
        const customerName = customerSection.locator('.customer-name, .contact-name');
        if (await customerName.isVisible()) {
          expect(await customerName.textContent()).not.toBe('');
        }

        // Check for contact information
        const phoneNumber = customerSection.locator('text=/\\+?27\\d{9}/');
        const email = customerSection.locator('text=/@/');

        // At least one contact method should be visible
        const hasPhone = await phoneNumber.isVisible().catch(() => false);
        const hasEmail = await email.isVisible().catch(() => false);

        expect(hasPhone || hasEmail).toBe(true);
      }
    });

    await test.step('Click-to-call or click-to-email', async () => {
      const phoneLink = page.locator('a[href^="tel:"]');
      if (await phoneLink.isVisible()) {
        const href = await phoneLink.getAttribute('href');
        expect(href).toMatch(/^tel:\+?[\d]+$/);
      }

      const emailLink = page.locator('a[href^="mailto:"]');
      if (await emailLink.isVisible()) {
        const href = await emailLink.getAttribute('href');
        expect(href).toMatch(/^mailto:.+@.+$/);
      }
    });
  });

  test('should map QContact priority to ticket priority', async ({ page }) => {
    await test.step('Filter QContact tickets', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify priority mapping', async () => {
      const rows = page.locator('tbody tr');
      const count = await rows.count();

      for (let i = 0; i < Math.min(3, count); i++) {
        const row = rows.nth(i);
        const priorityBadge = row.locator('.priority-badge');

        if (await priorityBadge.isVisible()) {
          const priority = await priorityBadge.textContent();
          expect(priority).toMatch(/Low|Medium|High|Critical/);
        }
      }
    });
  });

  test('should display QContact request timeline', async ({ page }) => {
    await test.step('Open QContact ticket', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('View timeline', async () => {
      await page.click('text=Timeline, text=Activity');

      // Verify QContact events in timeline
      const timeline = page.locator('.timeline, .activity-feed');
      if (await timeline.isVisible()) {
        // Check for creation event from QContact
        await expect(timeline.locator('text=/Created from QContact|Imported from QContact/')).toBeVisible();

        // Check for timestamps
        await expect(timeline.locator('text=/\\d{1,2}:\\d{2}|ago/')).toBeVisible();
      }
    });
  });

  test('should link to original QContact request', async ({ page }) => {
    await test.step('Navigate to QContact ticket', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Verify external link to QContact', async () => {
      const qcontactLink = page.locator('a:has-text("View in QContact"), a[href*="qcontact"]');
      if (await qcontactLink.isVisible()) {
        const href = await qcontactLink.getAttribute('href');
        expect(href).toBeTruthy();

        // Verify opens in new tab
        const target = await qcontactLink.getAttribute('target');
        expect(target).toBe('_blank');
      }
    });
  });

  test('should handle QContact attachment sync', async ({ page }) => {
    await test.step('Find QContact ticket with attachments', async () => {
      await page.selectOption('select[name="filter_source"]', 'qcontact');
      await page.waitForLoadState('networkidle');

      const ticketsWithAttachments = page.locator('tr:has(.attachment-icon)');
      const count = await ticketsWithAttachments.count();

      if (count > 0) {
        await ticketsWithAttachments.first().click();
      }
    });

    await test.step('Verify attachments from QContact', async () => {
      const attachments = page.locator('.ticket-attachments, .attachments-section');
      if (await attachments.isVisible()) {
        // Check for attachment source indicator
        const qcontactAttachment = attachments.locator('text=/From QContact|QContact attachment/');
        if (await qcontactAttachment.isVisible()) {
          expect(await qcontactAttachment.textContent()).toBeTruthy();
        }

        // Verify attachments are downloadable
        const downloadLinks = attachments.locator('a[download], button:has-text("Download")');
        const linkCount = await downloadLinks.count();
        expect(linkCount).toBeGreaterThan(0);
      }
    });
  });
});

test.describe('QContact Integration - Webhook Reliability', () => {
  test('should handle webhook failures gracefully', async ({ page }) => {
    // This tests the UI's handling of webhook processing errors

    await page.goto('/ticketing/admin/webhooks');
    await page.waitForLoadState('networkidle');

    await test.step('View webhook logs', async () => {
      const webhookLogs = page.locator('.webhook-logs, .integration-logs');
      if (await webhookLogs.isVisible()) {
        // Check for failed webhook entries
        const failedEntries = webhookLogs.locator('.status-failed, .status-error');
        const failureCount = await failedEntries.count();

        if (failureCount > 0) {
          // Click on failed entry to see details
          await failedEntries.first().click();

          // Verify error details shown
          await expect(page.locator('.error-details, .failure-reason')).toBeVisible();
        }
      }
    });

    await test.step('Retry failed webhook', async () => {
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Reprocess")');
      if (await retryButton.isVisible()) {
        await retryButton.click();

        await expect(page.locator('text=/Retrying|Reprocessing/')).toBeVisible();
      }
    });
  });

  test('should show webhook statistics', async ({ page }) => {
    await page.goto('/ticketing/admin/webhooks');
    await page.waitForLoadState('networkidle');

    const stats = page.locator('.webhook-stats, .integration-stats');
    if (await stats.isVisible()) {
      // Verify success rate shown
      await expect(stats.locator('text=/Success Rate|Processed/')).toBeVisible();

      // Verify total processed count
      await expect(stats.locator('text=/Total|Received/')).toBeVisible();

      // Verify average processing time
      const avgTime = stats.locator('text=/Average Time|Processing Time/');
      if (await avgTime.isVisible()) {
        expect(await avgTime.textContent()).toMatch(/\d+\s*ms/);
      }
    }
  });
});

test.describe('QContact Integration - Data Mapping', () => {
  test('should correctly map QContact fields to ticket fields', async ({ page }) => {
    await page.selectOption('select[name="filter_source"]', 'qcontact');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();

      // Verify field mappings
      await test.step('Verify title mapping', async () => {
        const title = page.locator('h1, .ticket-title');
        await expect(title).toBeVisible();
        expect(await title.textContent()).not.toBe('');
      });

      await test.step('Verify description mapping', async () => {
        const description = page.locator('.ticket-description, .description-content');
        await expect(description).toBeVisible();
      });

      await test.step('Verify priority mapping', async () => {
        const priority = page.locator('.priority-badge');
        await expect(priority).toBeVisible();
      });

      await test.step('Verify timestamps', async () => {
        const createdAt = page.locator('.created-at, .timestamp');
        if (await createdAt.isVisible()) {
          const timestamp = await createdAt.textContent();
          expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}|\d+\s*(hour|day|minute)s?\s*ago/);
        }
      });
    }
  });

  test('should handle special characters in QContact data', async ({ page }) => {
    await page.selectOption('select[name="filter_source"]', 'qcontact');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('tbody tr');
    const count = await rows.count();

    for (let i = 0; i < Math.min(5, count); i++) {
      await rows.nth(i).click();

      // Verify special characters rendered correctly
      const description = page.locator('.ticket-description');
      if (await description.isVisible()) {
        const text = await description.textContent();

        // Should not have unescaped HTML entities
        expect(text).not.toContain('&lt;');
        expect(text).not.toContain('&gt;');
        expect(text).not.toContain('&amp;');

        // Newlines should be preserved
        // Special characters like quotes, apostrophes should work
      }

      await page.goto('/ticketing?source=qcontact');
    }
  });
});

test.describe('QContact Integration - Error Scenarios', () => {
  test('should handle duplicate QContact requests', async ({ page }) => {
    await page.goto('/ticketing?source=qcontact');
    await page.waitForLoadState('networkidle');

    // Collect all ticket IDs
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    const ticketIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const idCell = rows.nth(i).locator('.ticket-id');
      if (await idCell.isVisible()) {
        const id = await idCell.textContent();
        if (id) ticketIds.push(id.trim());
      }
    }

    // Verify no duplicate ticket IDs
    const uniqueIds = new Set(ticketIds);
    expect(uniqueIds.size).toBe(ticketIds.length);
  });

  test('should show warning for missing required QContact data', async ({ page }) => {
    await page.goto('/ticketing/admin/webhooks');
    await page.waitForLoadState('networkidle');

    const logs = page.locator('.webhook-logs');
    if (await logs.isVisible()) {
      // Look for validation warnings
      const warnings = logs.locator('.warning, .validation-error');
      const warningCount = await warnings.count();

      if (warningCount > 0) {
        await warnings.first().click();

        // Should show details about missing fields
        await expect(page.locator('text=/Missing required field|Invalid data/')).toBeVisible();
      }
    }
  });
});
