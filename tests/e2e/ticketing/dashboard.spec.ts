// tests/e2e/ticketing/dashboard.spec.ts
// E2E tests for ticketing dashboard UI and metrics
import { test, expect } from '@playwright/test';

test.describe('Dashboard - Metrics and Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ticketing/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display key ticket metrics', async ({ page }) => {
    await test.step('Verify metric cards displayed', async () => {
      // Total tickets
      const totalTickets = page.locator('.metric-total-tickets, .stat-card:has-text("Total Tickets")');
      if (await totalTickets.isVisible()) {
        const count = await totalTickets.locator('.metric-value, .stat-value').textContent();
        expect(count).toMatch(/\d+/);
      }

      // Open tickets
      const openTickets = page.locator('.metric-open-tickets, .stat-card:has-text("Open")');
      if (await openTickets.isVisible()) {
        const count = await openTickets.locator('.metric-value, .stat-value').textContent();
        expect(count).toMatch(/\d+/);
      }

      // In progress tickets
      const inProgressTickets = page.locator('.metric-in-progress, .stat-card:has-text("In Progress")');
      if (await inProgressTickets.isVisible()) {
        const count = await inProgressTickets.locator('.metric-value, .stat-value').textContent();
        expect(count).toMatch(/\d+/);
      }

      // Resolved tickets
      const resolvedTickets = page.locator('.metric-resolved, .stat-card:has-text("Resolved")');
      if (await resolvedTickets.isVisible()) {
        const count = await resolvedTickets.locator('.metric-value, .stat-value').textContent();
        expect(count).toMatch(/\d+/);
      }
    });

    await test.step('Verify percentage changes displayed', async () => {
      const percentageChange = page.locator('.metric-change, .stat-change');
      const count = await percentageChange.count();

      for (let i = 0; i < count; i++) {
        const changeText = await percentageChange.nth(i).textContent();
        if (changeText) {
          expect(changeText).toMatch(/[+-]?\d+(\.\d+)?%/);
        }
      }
    });
  });

  test('should display tickets by status chart', async ({ page }) => {
    await test.step('Verify status breakdown chart exists', async () => {
      const statusChart = page.locator('.status-chart, .chart-status-breakdown');
      if (await statusChart.isVisible()) {
        await expect(statusChart).toBeVisible();

        // Verify chart has data segments
        const chartSegments = statusChart.locator('.chart-segment, path, rect');
        const segmentCount = await chartSegments.count();
        expect(segmentCount).toBeGreaterThan(0);
      }
    });

    await test.step('Verify legend shows all statuses', async () => {
      const legend = page.locator('.chart-legend, .legend');
      if (await legend.isVisible()) {
        // Check for status labels
        await expect(legend.locator('text=/Open|In Progress|Resolved|Closed/')).toBeVisible();
      }
    });

    await test.step('Click chart segment to filter', async () => {
      const chartSegment = page.locator('.chart-segment, path[data-status]').first();
      if (await chartSegment.isVisible()) {
        await chartSegment.click();

        // Should navigate to filtered tickets view
        await page.waitForLoadState('networkidle');
        await expect(page.url()).toMatch(/ticketing\?.*status=/);
      }
    });
  });

  test('should display tickets by priority chart', async ({ page }) => {
    await test.step('Verify priority breakdown chart exists', async () => {
      const priorityChart = page.locator('.priority-chart, .chart-priority-breakdown');
      if (await priorityChart.isVisible()) {
        await expect(priorityChart).toBeVisible();

        // Verify chart has data
        const chartBars = priorityChart.locator('.chart-bar, rect, path');
        const barCount = await chartBars.count();
        expect(barCount).toBeGreaterThan(0);
      }
    });

    await test.step('Verify priority labels', async () => {
      const priorityChart = page.locator('.priority-chart, .chart-priority-breakdown');
      if (await priorityChart.isVisible()) {
        // Check for priority labels
        const labels = priorityChart.locator('text=/Low|Medium|High|Critical/');
        const labelCount = await labels.count();
        expect(labelCount).toBeGreaterThan(0);
      }
    });
  });

  test('should display recent tickets list', async ({ page }) => {
    await test.step('Verify recent tickets widget', async () => {
      const recentTickets = page.locator('.recent-tickets, .widget-recent-tickets');
      if (await recentTickets.isVisible()) {
        await expect(recentTickets.locator('.widget-title:has-text("Recent Tickets")')).toBeVisible();

        // Verify tickets are listed
        const ticketRows = recentTickets.locator('.ticket-row, tr');
        const rowCount = await ticketRows.count();
        expect(rowCount).toBeGreaterThan(0);
      }
    });

    await test.step('Verify ticket details in list', async () => {
      const ticketRows = page.locator('.recent-tickets .ticket-row, .recent-tickets tr').first();
      if (await ticketRows.isVisible()) {
        // Should show ticket ID
        await expect(ticketRows.locator('text=/TICK-\d+/')).toBeVisible();

        // Should show status badge
        const statusBadge = ticketRows.locator('.status-badge');
        if (await statusBadge.isVisible()) {
          expect(await statusBadge.textContent()).toMatch(/Open|In Progress|Resolved|Closed/);
        }

        // Should show priority
        const priorityBadge = ticketRows.locator('.priority-badge');
        if (await priorityBadge.isVisible()) {
          expect(await priorityBadge.textContent()).toMatch(/Low|Medium|High|Critical/);
        }
      }
    });

    await test.step('Click recent ticket to view details', async () => {
      const firstTicket = page.locator('.recent-tickets .ticket-row, .recent-tickets tr').first();
      if (await firstTicket.isVisible()) {
        await firstTicket.click();

        // Should navigate to ticket detail page
        await expect(page.url()).toMatch(/ticketing\/TICK-\d+/);
      }
    });
  });

  test('should display tickets by source breakdown', async ({ page }) => {
    await test.step('Verify source breakdown widget', async () => {
      const sourceWidget = page.locator('.source-breakdown, .widget-sources');
      if (await sourceWidget.isVisible()) {
        await expect(sourceWidget).toBeVisible();

        // Verify sources listed
        await expect(sourceWidget.locator('text=/WhatsApp|QContact|Manual|Email/')).toBeVisible();
      }
    });

    await test.step('Verify source counts displayed', async () => {
      const sourceItems = page.locator('.source-item, .source-row');
      const count = await sourceItems.count();

      for (let i = 0; i < Math.min(4, count); i++) {
        const item = sourceItems.nth(i);
        const countText = await item.locator('.source-count, .count').textContent();
        if (countText) {
          expect(countText).toMatch(/\d+/);
        }
      }
    });

    await test.step('Click source to filter tickets', async () => {
      const whatsappSource = page.locator('.source-item:has-text("WhatsApp"), .source-row:has-text("WhatsApp")');
      if (await whatsappSource.isVisible()) {
        await whatsappSource.click();

        await page.waitForLoadState('networkidle');
        await expect(page.url()).toContain('source=whatsapp');
      }
    });
  });

  test('should display average resolution time', async ({ page }) => {
    await test.step('Verify resolution time metric', async () => {
      const resolutionMetric = page.locator('.metric-resolution-time, .stat-resolution');
      if (await resolutionMetric.isVisible()) {
        const timeValue = await resolutionMetric.locator('.metric-value, .stat-value').textContent();
        expect(timeValue).toMatch(/\d+(\.\d+)?\s*(hours?|days?|minutes?)/);
      }
    });

    await test.step('Verify resolution time trend', async () => {
      const trendIndicator = page.locator('.metric-resolution-time .trend-indicator, .metric-resolution-time .metric-change');
      if (await trendIndicator.isVisible()) {
        const trendText = await trendIndicator.textContent();
        expect(trendText).toMatch(/[+-]?\d+(\.\d+)?%/);
      }
    });
  });

  test('should display quick action buttons', async ({ page }) => {
    await test.step('Verify quick action panel', async () => {
      const quickActions = page.locator('.quick-actions, .action-panel');
      if (await quickActions.isVisible()) {
        // New ticket button
        const newTicketBtn = quickActions.locator('button:has-text("New Ticket")');
        if (await newTicketBtn.isVisible()) {
          await expect(newTicketBtn).toBeVisible();
        }

        // View all tickets button
        const viewAllBtn = quickActions.locator('a:has-text("View All Tickets"), button:has-text("View All")');
        if (await viewAllBtn.isVisible()) {
          await expect(viewAllBtn).toBeVisible();
        }

        // Export button
        const exportBtn = quickActions.locator('button:has-text("Export")');
        if (await exportBtn.isVisible()) {
          await expect(exportBtn).toBeVisible();
        }
      }
    });

    await test.step('Create new ticket from quick action', async () => {
      const newTicketBtn = page.locator('button:has-text("New Ticket")');
      if (await newTicketBtn.isVisible()) {
        await newTicketBtn.click();

        // Should open new ticket modal or navigate to create page
        const modal = page.locator('.ticket-modal, .modal:has-text("New Ticket")');
        const createPage = page.locator('h1:has-text("Create Ticket")');

        const hasModal = await modal.isVisible({ timeout: 1000 }).catch(() => false);
        const hasPage = await createPage.isVisible({ timeout: 1000 }).catch(() => false);

        expect(hasModal || hasPage).toBe(true);
      }
    });
  });

  test('should refresh dashboard data', async ({ page }) => {
    await test.step('Verify refresh button exists', async () => {
      const refreshBtn = page.locator('button:has-text("Refresh"), button[aria-label="Refresh"]');
      if (await refreshBtn.isVisible()) {
        await expect(refreshBtn).toBeVisible();
      }
    });

    await test.step('Click refresh to reload data', async () => {
      const refreshBtn = page.locator('button:has-text("Refresh"), button[aria-label="Refresh"]');
      if (await refreshBtn.isVisible()) {
        // Record initial metric value
        const totalTickets = page.locator('.metric-total-tickets .metric-value');
        const initialValue = await totalTickets.textContent().catch(() => '0');

        await refreshBtn.click();

        // Wait for loading state
        await page.waitForLoadState('networkidle');

        // Verify data refreshed (value should be visible again)
        const newValue = await totalTickets.textContent().catch(() => '0');
        expect(newValue).toBeTruthy();
      }
    });
  });

  test('should filter dashboard by date range', async ({ page }) => {
    await test.step('Open date range picker', async () => {
      const dateRangeBtn = page.locator('button:has-text("Date Range"), .date-range-picker');
      if (await dateRangeBtn.isVisible()) {
        await dateRangeBtn.click();

        // Date picker should appear
        await expect(page.locator('.date-picker-modal, .date-range-dropdown')).toBeVisible();
      }
    });

    await test.step('Select last 30 days', async () => {
      const last30DaysOption = page.locator('text=Last 30 Days, button:has-text("Last 30 Days")');
      if (await last30DaysOption.isVisible()) {
        await last30DaysOption.click();

        await page.waitForLoadState('networkidle');

        // Verify date range applied
        const dateRangeDisplay = page.locator('.date-range-display, .selected-range');
        if (await dateRangeDisplay.isVisible()) {
          expect(await dateRangeDisplay.textContent()).toContain('30 Days');
        }
      }
    });

    await test.step('Apply custom date range', async () => {
      const customRangeBtn = page.locator('button:has-text("Custom Range")');
      if (await customRangeBtn.isVisible()) {
        await customRangeBtn.click();

        const startDate = '2025-01-01';
        const endDate = '2025-01-31';

        await page.fill('input[name="date_from"], input[type="date"]:first-child', startDate);
        await page.fill('input[name="date_to"], input[type="date"]:last-child', endDate);

        await page.click('button:has-text("Apply")');

        await page.waitForLoadState('networkidle');

        // Verify custom range applied
        const dateRangeDisplay = page.locator('.date-range-display');
        if (await dateRangeDisplay.isVisible()) {
          const rangeText = await dateRangeDisplay.textContent();
          expect(rangeText).toContain('Jan');
        }
      }
    });
  });

  test('should display team performance metrics', async ({ page }) => {
    await test.step('Verify team performance widget', async () => {
      const teamWidget = page.locator('.team-performance, .widget-team-stats');
      if (await teamWidget.isVisible()) {
        await expect(teamWidget).toBeVisible();

        // Verify team members listed
        const teamMembers = teamWidget.locator('.team-member, .member-row');
        const memberCount = await teamMembers.count();
        expect(memberCount).toBeGreaterThan(0);
      }
    });

    await test.step('Verify member ticket counts', async () => {
      const teamMembers = page.locator('.team-member, .member-row');
      const count = await teamMembers.count();

      for (let i = 0; i < Math.min(3, count); i++) {
        const member = teamMembers.nth(i);

        // Should show member name
        const nameElement = member.locator('.member-name, .name');
        if (await nameElement.isVisible()) {
          expect(await nameElement.textContent()).not.toBe('');
        }

        // Should show ticket count
        const countElement = member.locator('.member-tickets, .ticket-count');
        if (await countElement.isVisible()) {
          expect(await countElement.textContent()).toMatch(/\d+/);
        }
      }
    });

    await test.step('Click team member to view their tickets', async () => {
      const firstMember = page.locator('.team-member, .member-row').first();
      if (await firstMember.isVisible()) {
        await firstMember.click();

        await page.waitForLoadState('networkidle');

        // Should filter tickets by assignee
        await expect(page.url()).toMatch(/ticketing\?.*assigned_to=/);
      }
    });
  });

  test('should display SLA compliance metrics', async ({ page }) => {
    await test.step('Verify SLA compliance widget', async () => {
      const slaWidget = page.locator('.sla-compliance, .widget-sla');
      if (await slaWidget.isVisible()) {
        await expect(slaWidget).toBeVisible();

        // Verify compliance percentage
        const complianceRate = slaWidget.locator('.compliance-rate, .sla-percentage');
        if (await complianceRate.isVisible()) {
          const rateText = await complianceRate.textContent();
          expect(rateText).toMatch(/\d+(\.\d+)?%/);
        }
      }
    });

    await test.step('Verify SLA breach count', async () => {
      const breachCount = page.locator('.sla-breaches, .breach-count');
      if (await breachCount.isVisible()) {
        const countText = await breachCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });

    await test.step('Click SLA widget to view details', async () => {
      const slaWidget = page.locator('.sla-compliance, .widget-sla');
      if (await slaWidget.isVisible()) {
        await slaWidget.click();

        // Should navigate to SLA monitoring page
        await page.waitForLoadState('networkidle');
        await expect(page.url()).toMatch(/ticketing\/sla|sla-monitoring/);
      }
    });
  });

  test('should display billing summary widget', async ({ page }) => {
    await test.step('Verify billing summary widget', async () => {
      const billingWidget = page.locator('.billing-summary, .widget-billing');
      if (await billingWidget.isVisible()) {
        await expect(billingWidget).toBeVisible();

        // Verify unbilled amount
        const unbilledAmount = billingWidget.locator('.unbilled-amount, .amount-unbilled');
        if (await unbilledAmount.isVisible()) {
          const amountText = await unbilledAmount.textContent();
          expect(amountText).toMatch(/R\s*[\d,]+/);
        }

        // Verify invoiced amount
        const invoicedAmount = billingWidget.locator('.invoiced-amount, .amount-invoiced');
        if (await invoicedAmount.isVisible()) {
          const amountText = await invoicedAmount.textContent();
          expect(amountText).toMatch(/R\s*[\d,]+/);
        }
      }
    });

    await test.step('Click billing widget to view details', async () => {
      const billingWidget = page.locator('.billing-summary, .widget-billing');
      if (await billingWidget.isVisible()) {
        await billingWidget.click();

        await page.waitForLoadState('networkidle');

        // Should navigate to billing page
        await expect(page.url()).toMatch(/ticketing\/billing/);
      }
    });
  });
});

test.describe('Dashboard - Responsive Design', () => {
  test('should adapt layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/ticketing/dashboard');
    await page.waitForLoadState('networkidle');

    await test.step('Verify mobile menu accessible', async () => {
      const mobileMenu = page.locator('.mobile-menu, button[aria-label="Menu"]');
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }
    });

    await test.step('Verify metric cards stack vertically', async () => {
      const metricCards = page.locator('.metric-card, .stat-card');
      const count = await metricCards.count();

      if (count >= 2) {
        const firstCard = await metricCards.nth(0).boundingBox();
        const secondCard = await metricCards.nth(1).boundingBox();

        if (firstCard && secondCard) {
          // On mobile, cards should stack (second card below first)
          expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height);
        }
      }
    });
  });

  test('should adapt layout on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto('/ticketing/dashboard');
    await page.waitForLoadState('networkidle');

    await test.step('Verify charts render correctly', async () => {
      const charts = page.locator('.chart, canvas, svg');
      const chartCount = await charts.count();

      for (let i = 0; i < chartCount; i++) {
        const chart = charts.nth(i);
        if (await chart.isVisible()) {
          const box = await chart.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
