'use client';

/**
 * Ticket List Page Client Component
 *
 * Displays filterable list of all tickets with:
 * - Status, type, assignee, project filters
 * - QA Ready indicator
 * - Fault cause column
 * - Search functionality
 * - Bulk actions
 * - Create new ticket button
 *
 * 🟢 WORKING: Ticket list page integrates TicketList component
 */

import { TicketList } from '@/modules/ticketing/components/TicketList/TicketList';
import Link from 'next/link';

export default function TicketsListPageClient() {
  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ff-text-primary)]">Tickets</h1>
          <p className="text-[var(--ff-text-secondary)]">View and manage all tickets</p>
        </div>
        <Link
          href="/ticketing/tickets/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Ticket
        </Link>
      </div>

      <TicketList />
    </div>
  );
}
