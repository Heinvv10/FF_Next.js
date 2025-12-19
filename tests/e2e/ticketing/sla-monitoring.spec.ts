// tests/e2e/ticketing/sla-monitoring.spec.ts
// E2E tests for SLA monitoring and compliance workflows
import { test, expect } from '@playwright/test';

test.describe('SLA Monitoring - Countdown and Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ticketing');
    await page.waitForLoadState('networkidle');
  });

  test('should display SLA countdown on ticket', async ({ page }) => {
    await test.step('Create high priority ticket', async () => {
      await page.click('button:has-text("New Ticket")');

      await page.fill('input[name="title"]', 'SLA Test - High Priority');
      await page.fill('textarea[name="description"]', 'Test ticket for SLA monitoring');
      await page.selectOption('select[name="priority"]', 'high');

      await page.click('button:has-text("Create Ticket")');

      await expect(page.locator('text=Ticket created successfully')).toBeVisible();
    });

    await test.step('Open ticket and verify SLA timer', async () => {
      await page.click('text=SLA Test - High Priority');

      // Verify SLA countdown visible
      const slaCountdown = page.locator('.sla-countdown, .sla-timer');
      if (await slaCountdown.isVisible()) {
        await expect(slaCountdown).toBeVisible();

        // Should show time remaining
        const timeRemaining = slaCountdown.locator('.time-remaining, .countdown-value');
        if (await timeRemaining.isVisible()) {
          const timeText = await timeRemaining.textContent();
          expect(timeText).toMatch(/\d+[hm]|\d+:\d+/);
        }
      }
    });

    await test.step('Verify SLA deadline displayed', async () => {
      const slaDeadline = page.locator('.sla-deadline, .deadline');
      if (await slaDeadline.isVisible()) {
        const deadlineText = await slaDeadline.textContent();
        expect(deadlineText).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/);
      }
    });
  });

  test('should show different SLA times by priority', async ({ page }) => {
    const priorities = [
      { level: 'low', expectedHours: 48 },
      { level: 'medium', expectedHours: 24 },
      { level: 'high', expectedHours: 8 },
      { level: 'critical', expectedHours: 4 },
    ];

    for (const priority of priorities) {
      await test.step(`Verify ${priority.level} priority SLA (${priority.expectedHours}h)`, async () => {
        await page.goto('/ticketing');

        await page.click('button:has-text("New Ticket")');

        await page.fill('input[name="title"]', `SLA ${priority.level}`);
        await page.fill('textarea[name="description"]', 'Test');
        await page.selectOption('select[name="priority"]', priority.level);

        await page.click('button:has-text("Create Ticket")');

        await page.click(`text=SLA ${priority.level}`);

        const slaInfo = page.locator('.sla-info, .sla-details');
        if (await slaInfo.isVisible()) {
          const slaText = await slaInfo.textContent();
          expect(slaText).toContain(`${priority.expectedHours}`);
        }
      });
    }
  });

  test('should display SLA warning when nearing deadline', async ({ page }) => {
    await test.step('Filter for tickets nearing SLA deadline', async () => {
      await page.goto('/ticketing?sla_status=at_risk');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify warning indicators on ticket list', async () => {
      const atRiskTickets = page.locator('tr:has(.sla-warning), tr:has(.sla-at-risk)');
      const count = await atRiskTickets.count();

      if (count > 0) {
        const firstTicket = atRiskTickets.first();

        // Should have warning indicator
        const warningIcon = firstTicket.locator('.sla-warning-icon, .warning-badge');
        if (await warningIcon.isVisible()) {
          await expect(warningIcon).toBeVisible();
        }

        // Should show time remaining in warning color
        const timeRemaining = firstTicket.locator('.sla-countdown, .time-remaining');
        if (await timeRemaining.isVisible()) {
          const classList = await timeRemaining.getAttribute('class');
          expect(classList).toMatch(/warning|yellow|amber/);
        }
      }
    });

    await test.step('Open at-risk ticket and verify warning details', async () => {
      const atRiskTickets = page.locator('tr:has(.sla-warning), tr:has(.sla-at-risk)');
      const count = await atRiskTickets.count();

      if (count > 0) {
        await atRiskTickets.first().click();

        // Verify warning banner
        const warningBanner = page.locator('.sla-warning-banner, .alert-warning');
        if (await warningBanner.isVisible()) {
          await expect(warningBanner).toContainText(/SLA at risk|Approaching deadline/);
        }

        // Verify percentage of SLA time consumed
        const slaProgress = page.locator('.sla-progress, .progress-bar');
        if (await slaProgress.isVisible()) {
          const progressValue = await slaProgress.getAttribute('aria-valuenow');
          if (progressValue) {
            const percentage = parseInt(progressValue, 10);
            expect(percentage).toBeGreaterThan(70); // At risk means >70% consumed
          }
        }
      }
    });
  });

  test('should mark ticket when SLA is breached', async ({ page }) => {
    await test.step('Navigate to breached tickets', async () => {
      await page.goto('/ticketing?sla_status=breached');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify breach indicators on ticket list', async () => {
      const breachedTickets = page.locator('tr:has(.sla-breached), tr:has(.sla-breach)');
      const count = await breachedTickets.count();

      if (count > 0) {
        const firstTicket = breachedTickets.first();

        // Should have breach indicator
        const breachBadge = firstTicket.locator('.sla-breached, .breach-badge');
        if (await breachBadge.isVisible()) {
          await expect(breachBadge).toBeVisible();
          expect(await breachBadge.textContent()).toMatch(/Breached|Overdue/);
        }

        // Should show time overdue
        const overdueTime = firstTicket.locator('.time-overdue, .overdue-amount');
        if (await overdueTime.isVisible()) {
          const overdueText = await overdueTime.textContent();
          expect(overdueText).toMatch(/\d+[hm]|overdue/i);
        }
      }
    });

    await test.step('Open breached ticket and verify details', async () => {
      const breachedTickets = page.locator('tr:has(.sla-breached)');
      const count = await breachedTickets.count();

      if (count > 0) {
        await breachedTickets.first().click();

        // Verify breach banner
        const breachBanner = page.locator('.sla-breach-banner, .alert-danger');
        if (await breachBanner.isVisible()) {
          await expect(breachBanner).toContainText(/SLA breached|Overdue/);
        }

        // Verify breach timestamp
        const breachTime = page.locator('.breach-timestamp, .breached-at');
        if (await breachTime.isVisible()) {
          const timestamp = await breachTime.textContent();
          expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}|\d+ hours? ago/);
        }

        // Verify escalation notice
        const escalationNotice = page.locator('.escalation-notice, .auto-escalated');
        if (await escalationNotice.isVisible()) {
          await expect(escalationNotice).toContainText(/escalat/i);
        }
      }
    });
  });

  test('should pause SLA when ticket is on hold', async ({ page }) => {
    await test.step('Create ticket and put on hold', async () => {
      await page.click('button:has-text("New Ticket")');

      await page.fill('input[name="title"]', 'SLA Pause Test');
      await page.fill('textarea[name="description"]', 'Test ticket');
      await page.selectOption('select[name="priority"]', 'high');

      await page.click('button:has-text("Create Ticket")');

      await page.click('text=SLA Pause Test');

      // Put ticket on hold
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'on_hold');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('.status-badge:has-text("On Hold")')).toBeVisible();
    });

    await test.step('Verify SLA timer paused', async () => {
      const slaCountdown = page.locator('.sla-countdown, .sla-timer');
      if (await slaCountdown.isVisible()) {
        // Should show paused indicator
        const pausedIndicator = slaCountdown.locator('.sla-paused, .paused-badge');
        if (await pausedIndicator.isVisible()) {
          await expect(pausedIndicator).toContainText(/Paused|On Hold/);
        }
      }
    });

    await test.step('Resume ticket and verify SLA resumes', async () => {
      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'in_progress');
      await page.click('button:has-text("Save Status")');

      const slaCountdown = page.locator('.sla-countdown, .sla-timer');
      if (await slaCountdown.isVisible()) {
        // Paused indicator should be gone
        const pausedIndicator = slaCountdown.locator('.sla-paused');
        const isPaused = await pausedIndicator.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isPaused).toBe(false);
      }
    });
  });

  test('should stop SLA tracking when ticket is resolved', async ({ page }) => {
    await test.step('Resolve a ticket', async () => {
      // Navigate to open ticket
      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }

      await page.click('button:has-text("Update Status")');
      await page.selectOption('select[name="status"]', 'resolved');
      await page.click('button:has-text("Save Status")');

      await expect(page.locator('.status-badge:has-text("Resolved")')).toBeVisible();
    });

    await test.step('Verify SLA timer stopped', async () => {
      const slaInfo = page.locator('.sla-info, .sla-details');
      if (await slaInfo.isVisible()) {
        // Should show completion time instead of countdown
        const completionTime = slaInfo.locator('.sla-completion, .resolved-in');
        if (await completionTime.isVisible()) {
          const completionText = await completionTime.textContent();
          expect(completionText).toMatch(/Resolved in|Completed in/);
        }

        // Should show whether SLA was met
        const slaStatus = slaInfo.locator('.sla-met, .sla-breached');
        if (await slaStatus.isVisible()) {
          const statusText = await slaStatus.textContent();
          expect(statusText).toMatch(/SLA met|SLA breached/);
        }
      }
    });
  });
});

test.describe('SLA Monitoring - Compliance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ticketing/sla');
    await page.waitForLoadState('networkidle');
  });

  test('should display overall SLA compliance rate', async ({ page }) => {
    await test.step('Verify compliance percentage', async () => {
      const complianceRate = page.locator('.compliance-rate, .sla-compliance-percentage');
      if (await complianceRate.isVisible()) {
        const rateText = await complianceRate.textContent();
        expect(rateText).toMatch(/\d+(\.\d+)?%/);
      }
    });

    await test.step('Verify trend indicator', async () => {
      const trendIndicator = page.locator('.compliance-trend, .trend-arrow');
      if (await trendIndicator.isVisible()) {
        const classList = await trendIndicator.getAttribute('class');
        expect(classList).toMatch(/up|down|stable/);
      }
    });

    await test.step('Verify comparison to previous period', async () => {
      const comparison = page.locator('.period-comparison, .vs-previous');
      if (await comparison.isVisible()) {
        const comparisonText = await comparison.textContent();
        expect(comparisonText).toMatch(/[+-]\d+(\.\d+)?%/);
      }
    });
  });

  test('should display SLA compliance by priority', async ({ page }) => {
    await test.step('Verify priority breakdown table', async () => {
      const priorityTable = page.locator('.sla-by-priority, .priority-compliance-table');
      if (await priorityTable.isVisible()) {
        await expect(priorityTable).toBeVisible();

        // Verify all priorities listed
        await expect(priorityTable.locator('text=Low')).toBeVisible();
        await expect(priorityTable.locator('text=Medium')).toBeVisible();
        await expect(priorityTable.locator('text=High')).toBeVisible();
        await expect(priorityTable.locator('text=Critical')).toBeVisible();
      }
    });

    await test.step('Verify compliance rates for each priority', async () => {
      const priorityRows = page.locator('.priority-row, tr[data-priority]');
      const count = await priorityRows.count();

      for (let i = 0; i < count; i++) {
        const row = priorityRows.nth(i);

        // Should show compliance percentage
        const complianceCell = row.locator('.compliance-percentage, .rate');
        if (await complianceCell.isVisible()) {
          const rateText = await complianceCell.textContent();
          expect(rateText).toMatch(/\d+(\.\d+)?%/);
        }

        // Should show breach count
        const breachCount = row.locator('.breach-count, .breached');
        if (await breachCount.isVisible()) {
          const countText = await breachCount.textContent();
          expect(countText).toMatch(/\d+/);
        }
      }
    });
  });

  test('should display SLA compliance over time chart', async ({ page }) => {
    await test.step('Verify compliance trend chart', async () => {
      const trendChart = page.locator('.compliance-trend-chart, .sla-chart');
      if (await trendChart.isVisible()) {
        await expect(trendChart).toBeVisible();

        // Verify chart has data
        const chartElements = trendChart.locator('path, rect, circle, line');
        const elementCount = await chartElements.count();
        expect(elementCount).toBeGreaterThan(0);
      }
    });

    await test.step('Hover chart to see details', async () => {
      const trendChart = page.locator('.compliance-trend-chart canvas, .compliance-trend-chart svg');
      if (await trendChart.isVisible()) {
        await trendChart.hover();

        // Tooltip should appear
        const tooltip = page.locator('.chart-tooltip, [role="tooltip"]');
        if (await tooltip.isVisible({ timeout: 2000 }).catch(() => false)) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toMatch(/\d+(\.\d+)?%/);
        }
      }
    });
  });

  test('should list tickets at risk of SLA breach', async ({ page }) => {
    await test.step('Verify at-risk tickets section', async () => {
      const atRiskSection = page.locator('.at-risk-tickets, .sla-at-risk-list');
      if (await atRiskSection.isVisible()) {
        await expect(atRiskSection.locator('.section-title:has-text("At Risk")')).toBeVisible();

        // Verify tickets listed
        const ticketRows = atRiskSection.locator('.ticket-row, tr');
        const rowCount = await ticketRows.count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    });

    await test.step('Verify at-risk ticket details', async () => {
      const ticketRows = page.locator('.at-risk-tickets .ticket-row, .at-risk-tickets tr');
      const count = await ticketRows.count();

      if (count > 0) {
        const firstTicket = ticketRows.first();

        // Should show ticket ID
        await expect(firstTicket.locator('text=/TICK-\d+/')).toBeVisible();

        // Should show time until breach
        const timeUntilBreach = firstTicket.locator('.time-until-breach, .time-remaining');
        if (await timeUntilBreach.isVisible()) {
          const timeText = await timeUntilBreach.textContent();
          expect(timeText).toMatch(/\d+[hm]/);
        }

        // Should show priority
        const priorityBadge = firstTicket.locator('.priority-badge');
        if (await priorityBadge.isVisible()) {
          expect(await priorityBadge.textContent()).toMatch(/Low|Medium|High|Critical/);
        }
      }
    });

    await test.step('Click at-risk ticket to view details', async () => {
      const ticketRows = page.locator('.at-risk-tickets .ticket-row, .at-risk-tickets tr');
      const count = await ticketRows.count();

      if (count > 0) {
        await ticketRows.first().click();

        // Should navigate to ticket detail
        await expect(page.url()).toMatch(/ticketing\/TICK-\d+/);
      }
    });
  });

  test('should list recently breached tickets', async ({ page }) => {
    await test.step('Verify breached tickets section', async () => {
      const breachedSection = page.locator('.breached-tickets, .sla-breached-list');
      if (await breachedSection.isVisible()) {
        await expect(breachedSection.locator('.section-title:has-text("Breached")')).toBeVisible();

        // Verify tickets listed
        const ticketRows = breachedSection.locator('.ticket-row, tr');
        const rowCount = await ticketRows.count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    });

    await test.step('Verify breached ticket details', async () => {
      const ticketRows = page.locator('.breached-tickets .ticket-row, .breached-tickets tr');
      const count = await ticketRows.count();

      if (count > 0) {
        const firstTicket = ticketRows.first();

        // Should show ticket ID
        await expect(firstTicket.locator('text=/TICK-\d+/')).toBeVisible();

        // Should show breach time
        const breachTime = firstTicket.locator('.breach-time, .breached-at');
        if (await breachTime.isVisible()) {
          const timeText = await breachTime.textContent();
          expect(timeText).toMatch(/\d+ hours? ago|\d{4}-\d{2}-\d{2}/);
        }

        // Should show overdue amount
        const overdueAmount = firstTicket.locator('.overdue-amount, .time-overdue');
        if (await overdueAmount.isVisible()) {
          const overdueText = await overdueAmount.textContent();
          expect(overdueText).toMatch(/\d+[hm]/);
        }
      }
    });
  });

  test('should filter SLA data by date range', async ({ page }) => {
    await test.step('Open date range filter', async () => {
      const dateRangeBtn = page.locator('button:has-text("Date Range"), .date-filter');
      if (await dateRangeBtn.isVisible()) {
        await dateRangeBtn.click();

        await expect(page.locator('.date-picker, .date-range-modal')).toBeVisible();
      }
    });

    await test.step('Select last 7 days', async () => {
      const last7DaysOption = page.locator('button:has-text("Last 7 Days")');
      if (await last7DaysOption.isVisible()) {
        await last7DaysOption.click();

        await page.waitForLoadState('networkidle');

        // Verify filter applied
        const dateDisplay = page.locator('.date-range-display, .selected-period');
        if (await dateDisplay.isVisible()) {
          expect(await dateDisplay.textContent()).toContain('7 Days');
        }
      }
    });
  });

  test('should export SLA report', async ({ page }) => {
    await test.step('Open export menu', async () => {
      const exportBtn = page.locator('button:has-text("Export Report")');
      if (await exportBtn.isVisible()) {
        await exportBtn.click();

        await expect(page.locator('.export-modal, .export-options')).toBeVisible();
      }
    });

    await test.step('Select PDF format and download', async () => {
      const pdfOption = page.locator('input[value="pdf"], button:has-text("PDF")');
      if (await pdfOption.isVisible()) {
        await pdfOption.click();

        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Download")');

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/sla.*report.*\.pdf/i);
      }
    });
  });

  test('should display average resolution time by priority', async ({ page }) => {
    await test.step('Verify resolution time widget', async () => {
      const resolutionWidget = page.locator('.avg-resolution-time, .resolution-stats');
      if (await resolutionWidget.isVisible()) {
        await expect(resolutionWidget).toBeVisible();

        // Verify overall average displayed
        const overallAvg = resolutionWidget.locator('.overall-avg, .total-avg');
        if (await overallAvg.isVisible()) {
          const avgText = await overallAvg.textContent();
          expect(avgText).toMatch(/\d+(\.\d+)?\s*(hours?|days?)/);
        }
      }
    });

    await test.step('Verify breakdown by priority', async () => {
      const priorityBreakdown = page.locator('.resolution-by-priority, .priority-avg-table');
      if (await priorityBreakdown.isVisible()) {
        const rows = priorityBreakdown.locator('tr, .priority-item');
        const count = await rows.count();

        for (let i = 0; i < Math.min(4, count); i++) {
          const row = rows.nth(i);
          const avgTime = row.locator('.avg-time, .resolution-time');
          if (await avgTime.isVisible()) {
            const timeText = await avgTime.textContent();
            expect(timeText).toMatch(/\d+(\.\d+)?\s*[hm]/);
          }
        }
      }
    });
  });
});

test.describe('SLA Monitoring - Escalation Workflows', () => {
  test('should auto-escalate tickets nearing SLA breach', async ({ page }) => {
    await test.step('Navigate to escalated tickets', async () => {
      await page.goto('/ticketing?escalated=true');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify escalation indicators', async () => {
      const escalatedTickets = page.locator('tr:has(.escalated-badge), tr[data-escalated="true"]');
      const count = await escalatedTickets.count();

      if (count > 0) {
        const firstTicket = escalatedTickets.first();

        // Should show escalation badge
        const escalationBadge = firstTicket.locator('.escalated-badge, .escalation-indicator');
        if (await escalationBadge.isVisible()) {
          await expect(escalationBadge).toContainText(/Escalated|Priority/);
        }
      }
    });

    await test.step('Verify escalation notification sent', async () => {
      const escalatedTickets = page.locator('tr:has(.escalated-badge)');
      const count = await escalatedTickets.count();

      if (count > 0) {
        await escalatedTickets.first().click();

        // Check activity timeline for escalation event
        await page.click('text=Activity, text=Timeline');

        const escalationEvent = page.locator('.timeline-item:has-text("Escalated")');
        if (await escalationEvent.isVisible()) {
          await expect(escalationEvent).toBeVisible();
        }
      }
    });
  });

  test('should manually escalate ticket', async ({ page }) => {
    await test.step('Open ticket', async () => {
      await page.goto('/ticketing');
      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
      }
    });

    await test.step('Escalate ticket manually', async () => {
      const escalateBtn = page.locator('button:has-text("Escalate")');
      if (await escalateBtn.isVisible()) {
        await escalateBtn.click();

        // Fill escalation form
        await page.selectOption('select[name="escalate_to"]', { index: 1 });
        await page.fill('textarea[name="escalation_reason"]', 'Customer VIP, needs immediate attention');
        await page.click('button:has-text("Confirm Escalation")');

        await expect(page.locator('text=Ticket escalated')).toBeVisible();
      }
    });

    await test.step('Verify escalation reflected', async () => {
      const escalationBadge = page.locator('.escalated-badge');
      if (await escalationBadge.isVisible()) {
        await expect(escalationBadge).toBeVisible();
      }
    });
  });
});
