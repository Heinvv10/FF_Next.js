'use client';

/**
 * Ticketing Dashboard Page
 *
 * Displays ticketing module dashboard with:
 * - Summary statistics (open, in progress, closed tickets)
 * - SLA compliance metrics
 * - Workload distribution by assignee
 * - Recent tickets
 * - Escalation alerts
 *
 * 🟢 WORKING: Dashboard page integrates TicketingDashboard component
 */

export const dynamic = 'force-dynamic';

import { TicketingDashboard } from '@/modules/ticketing/components/Dashboard/TicketingDashboard';

export default function TicketingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticketing Dashboard</h1>
        <p className="text-gray-600">Manage fiber network issues, faults, and maintenance requests</p>
      </div>

      <TicketingDashboard />
    </div>
  );
}
