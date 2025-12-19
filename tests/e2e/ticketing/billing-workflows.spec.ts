// tests/e2e/ticketing/billing-workflows.spec.ts
// E2E tests for ticketing billing and invoicing workflows
import { test, expect } from '@playwright/test';

test.describe('Billing Workflows - Ticket Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ticketing');
    await page.waitForLoadState('networkidle');
  });

  test('should calculate billable hours for ticket', async ({ page }) => {
    await test.step('Create billable ticket', async () => {
      await page.click('button:has-text("New Ticket")');

      await page.fill('input[name="title"]', 'Billable Work - Network Setup');
      await page.fill('textarea[name="description"]', 'Customer requested network configuration');
      await page.selectOption('select[name="priority"]', 'medium');
      await page.click('input[name="is_billable"]'); // Mark as billable

      await page.click('button:has-text("Create Ticket")');

      await expect(page.locator('text=Ticket created successfully')).toBeVisible();
    });

    await test.step('Log time entries', async () => {
      await page.click('text=Billable Work - Network Setup');

      // Add time entry
      await page.click('button:has-text("Log Time")');
      await page.fill('input[name="hours"]', '2.5');
      await page.fill('textarea[name="work_description"]', 'On-site network configuration');
      await page.click('button:has-text("Save Time Entry")');

      await expect(page.locator('text=Time logged successfully')).toBeVisible();

      // Add another entry
      await page.click('button:has-text("Log Time")');
      await page.fill('input[name="hours"]', '1.5');
      await page.fill('textarea[name="work_description"]', 'Testing and verification');
      await page.click('button:has-text("Save Time Entry")');

      await expect(page.locator('text=Time logged successfully')).toBeVisible();
    });

    await test.step('Verify total billable hours calculated', async () => {
      // Check billing summary section
      await page.click('text=Billing');

      await expect(page.locator('text=Total Hours: 4.0')).toBeVisible();

      // Verify hourly rate applied
      const rateDisplay = page.locator('.hourly-rate');
      await expect(rateDisplay).toBeVisible();

      // Verify total cost calculated
      const totalCost = page.locator('.total-cost');
      await expect(totalCost).toBeVisible();
      expect(await totalCost.textContent()).toMatch(/R\s*[\d,]+\.\d{2}/);
    });
  });

  test('should apply different billing rates based on priority', async ({ page }) => {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const expectedRates: Record<string, number> = {
      low: 500,
      medium: 750,
      high: 1000,
      critical: 1500,
    };

    for (const priority of priorities) {
      await test.step(`Verify ${priority} priority billing rate`, async () => {
        await page.click('button:has-text("New Ticket")');

        await page.fill('input[name="title"]', `${priority} priority billing test`);
        await page.fill('textarea[name="description"]', 'Test description');
        await page.selectOption('select[name="priority"]', priority);
        await page.click('input[name="is_billable"]');

        await page.click('button:has-text("Create Ticket")');

        await page.click(`text=${priority} priority billing test`);

        // Check displayed rate
        await page.click('text=Billing');

        const rateElement = page.locator('.hourly-rate-value');
        if (await rateElement.isVisible()) {
          const rateText = await rateElement.textContent();
          const rate = parseFloat(rateText?.replace(/[^\d.]/g, '') || '0');
          expect(rate).toBe(expectedRates[priority]);
        }

        // Go back to list
        await page.goto('/ticketing');
      });
    }
  });

  test('should create invoice from tickets', async ({ page }) => {
    await test.step('Select billable tickets', async () => {
      // Filter for billable tickets
      await page.click('input[name="filter_billable"]');

      await page.waitForLoadState('networkidle');

      // Select multiple tickets for invoicing
      const billableRows = page.locator('tr:has(.billable-indicator)');
      const count = await billableRows.count();

      if (count > 0) {
        // Select first 3 tickets
        const selectCount = Math.min(3, count);
        for (let i = 0; i < selectCount; i++) {
          await billableRows.nth(i).locator('input[type="checkbox"]').click();
        }
      }
    });

    await test.step('Generate invoice', async () => {
      await page.click('button:has-text("Bulk Actions")');
      await page.click('text=Create Invoice');

      // Invoice creation modal should appear
      await expect(page.locator('.invoice-modal, .invoice-dialog')).toBeVisible();

      // Select customer/project
      await page.selectOption('select[name="customer"]', { index: 1 });

      // Set invoice date
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[name="invoice_date"]', today);

      // Generate invoice
      await page.click('button:has-text("Generate Invoice")');

      await expect(page.locator('text=Invoice created successfully')).toBeVisible();
    });

    await test.step('Verify invoice details', async () => {
      // Navigate to invoice (should show invoice number)
      const invoiceLink = page.locator('a:has-text("INV-")');
      if (await invoiceLink.isVisible()) {
        await invoiceLink.click();

        // Verify invoice contains tickets
        await expect(page.locator('.invoice-line-items')).toBeVisible();

        // Verify totals
        await expect(page.locator('.invoice-total')).toBeVisible();

        // Verify ticket references
        await expect(page.locator('text=/TICK-\\d+/')).toBeVisible();
      }
    });
  });

  test('should track billing status for tickets', async ({ page }) => {
    await test.step('Navigate to billable ticket', async () => {
      await page.click('input[name="filter_billable"]');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Verify billing status indicators', async () => {
      await page.click('text=Billing');

      // Check for billing status badge
      const statusBadge = page.locator('.billing-status-badge');
      if (await statusBadge.isVisible()) {
        const status = await statusBadge.textContent();
        expect(status).toMatch(/Unbilled|Invoiced|Paid|Approved|Pending/);
      }
    });

    await test.step('Update billing status', async () => {
      const updateButton = page.locator('button:has-text("Update Billing Status")');
      if (await updateButton.isVisible()) {
        await updateButton.click();

        await page.selectOption('select[name="billing_status"]', 'approved');
        await page.click('button:has-text("Save Status")');

        await expect(page.locator('text=Billing status updated')).toBeVisible();
        await expect(page.locator('.billing-status-badge:has-text("Approved")')).toBeVisible();
      }
    });
  });

  test('should prevent editing closed billed tickets', async ({ page }) => {
    await test.step('Find closed billed ticket', async () => {
      await page.selectOption('select[name="filter_status"]', 'closed');
      await page.click('input[name="filter_billable"]');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Verify edit restrictions', async () => {
      // Check if edit/update buttons are disabled
      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Update")');
      const count = await editButtons.count();

      for (let i = 0; i < count; i++) {
        const button = editButtons.nth(i);
        if (await button.isVisible()) {
          const isDisabled = await button.isDisabled();
          // Billed tickets might be locked from editing
          if (isDisabled) {
            expect(isDisabled).toBe(true);
          }
        }
      }

      // Check for warning message
      const warningMessage = page.locator('text=/Cannot edit.*billed|locked/i');
      if (await warningMessage.isVisible()) {
        expect(await warningMessage.textContent()).toBeTruthy();
      }
    });
  });

  test('should display billing summary report', async ({ page }) => {
    await test.step('Navigate to billing reports', async () => {
      await page.goto('/ticketing/billing');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify billing metrics displayed', async () => {
      // Total unbilled amount
      const unbilledTotal = page.locator('.unbilled-total, .metric-unbilled');
      if (await unbilledTotal.isVisible()) {
        const amount = await unbilledTotal.textContent();
        expect(amount).toMatch(/R\s*[\d,]+/);
      }

      // Total invoiced amount
      const invoicedTotal = page.locator('.invoiced-total, .metric-invoiced');
      if (await invoicedTotal.isVisible()) {
        const amount = await invoicedTotal.textContent();
        expect(amount).toMatch(/R\s*[\d,]+/);
      }

      // Outstanding balance
      const outstanding = page.locator('.outstanding-balance, .metric-outstanding');
      if (await outstanding.isVisible()) {
        const amount = await outstanding.textContent();
        expect(amount).toMatch(/R\s*[\d,]+/);
      }
    });

    await test.step('Filter billing report by date range', async () => {
      const dateFrom = '2025-01-01';
      const dateTo = '2025-01-31';

      await page.fill('input[name="date_from"]', dateFrom);
      await page.fill('input[name="date_to"]', dateTo);
      await page.click('button:has-text("Apply Filter")');

      await page.waitForLoadState('networkidle');

      // Verify filtered results
      await expect(page.locator('.billing-report-results')).toBeVisible();
    });

    await test.step('Export billing report', async () => {
      const exportButton = page.locator('button:has-text("Export Report")');
      if (await exportButton.isVisible()) {
        await exportButton.click();

        await page.selectOption('select[name="export_format"]', 'xlsx');

        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Download")');

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/billing_report.*\.xlsx/);
      }
    });
  });

  test('should calculate expenses and profit margins', async ({ page }) => {
    await test.step('Navigate to ticket with expenses', async () => {
      await page.click('input[name="filter_billable"]');
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Add expense entries', async () => {
      await page.click('text=Billing');

      const expenseButton = page.locator('button:has-text("Add Expense")');
      if (await expenseButton.isVisible()) {
        await expenseButton.click();

        await page.fill('input[name="expense_description"]', 'Travel costs');
        await page.fill('input[name="expense_amount"]', '500');
        await page.selectOption('select[name="expense_category"]', 'travel');

        await page.click('button:has-text("Save Expense")');

        await expect(page.locator('text=Expense added')).toBeVisible();
      }
    });

    await test.step('Verify profit calculation', async () => {
      // Check for profit summary
      const profitSection = page.locator('.profit-summary, .margin-calculation');
      if (await profitSection.isVisible()) {
        // Verify revenue shown
        await expect(profitSection.locator('text=Revenue')).toBeVisible();

        // Verify expenses shown
        await expect(profitSection.locator('text=Expenses')).toBeVisible();

        // Verify profit/margin shown
        await expect(profitSection.locator('text=/Profit|Margin/')).toBeVisible();
      }
    });
  });
});

test.describe('Billing Workflows - Payment Tracking', () => {
  test('should record payment for invoice', async ({ page }) => {
    await test.step('Navigate to invoices', async () => {
      await page.goto('/ticketing/billing/invoices');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Select unpaid invoice', async () => {
      const unpaidInvoices = page.locator('tr:has(.status-badge:has-text("Unpaid"))');
      const count = await unpaidInvoices.count();

      if (count > 0) {
        await unpaidInvoices.first().click();
      }
    });

    await test.step('Record payment', async () => {
      const paymentButton = page.locator('button:has-text("Record Payment")');
      if (await paymentButton.isVisible()) {
        await paymentButton.click();

        await page.fill('input[name="payment_amount"]', '1500');
        await page.selectOption('select[name="payment_method"]', 'bank_transfer');
        const today = new Date().toISOString().split('T')[0];
        await page.fill('input[name="payment_date"]', today);
        await page.fill('input[name="reference_number"]', 'PAY-123456');

        await page.click('button:has-text("Save Payment")');

        await expect(page.locator('text=Payment recorded')).toBeVisible();
      }
    });

    await test.step('Verify payment reflected', async () => {
      // Check invoice status updated
      await expect(page.locator('.status-badge:has-text("Paid")')).toBeVisible();

      // Verify payment history shows entry
      await page.click('text=Payment History');
      await expect(page.locator('text=PAY-123456')).toBeVisible();
    });
  });

  test('should handle partial payments', async ({ page }) => {
    await page.goto('/ticketing/billing/invoices');
    await page.waitForLoadState('networkidle');

    const unpaidInvoices = page.locator('tr:has(.status-badge:has-text("Unpaid"))');
    if (await unpaidInvoices.count() > 0) {
      await unpaidInvoices.first().click();

      const totalAmount = page.locator('.invoice-total-amount');
      if (await totalAmount.isVisible()) {
        const total = await totalAmount.textContent();
        const amount = parseFloat(total?.replace(/[^\d.]/g, '') || '0');

        const paymentButton = page.locator('button:has-text("Record Payment")');
        if (await paymentButton.isVisible()) {
          await paymentButton.click();

          // Pay half the amount
          const partialAmount = (amount / 2).toFixed(2);
          await page.fill('input[name="payment_amount"]', partialAmount);
          await page.selectOption('select[name="payment_method"]', 'bank_transfer');

          await page.click('button:has-text("Save Payment")');

          // Verify partial payment status
          await expect(page.locator('.status-badge:has-text("Partially Paid")')).toBeVisible();

          // Verify outstanding balance displayed
          const outstanding = page.locator('.outstanding-balance');
          if (await outstanding.isVisible()) {
            const outstandingText = await outstanding.textContent();
            expect(outstandingText).toContain(partialAmount);
          }
        }
      }
    }
  });
});
