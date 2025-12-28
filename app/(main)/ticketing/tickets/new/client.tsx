'use client';

/**
 * Create Ticket Page Client Component
 *
 * Allows users to manually create new tickets with:
 * - Ticket source selection (manual, construction, incident, etc.)
 * - DR number lookup from SOW module
 * - Location details (zone, pole, PON)
 * - Equipment information (ONT serial, RX level)
 * - Assignment to technicians/contractors
 * - Priority and SLA settings
 * - Fault cause classification (for maintenance tickets)
 *
 * ⚪ UNTESTED: Create ticket page awaiting TicketForm component implementation
 */

import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CreateTicketPageClient() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/ticketing/tickets"
          className="inline-flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ff-text-primary)]">Create New Ticket</h1>
            <p className="text-[var(--ff-text-secondary)]">Create a new ticketing record for fiber network issues</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--ff-bg-secondary)] rounded-lg shadow-md p-6 border border-[var(--ff-border-light)]">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[var(--ff-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[var(--ff-text-tertiary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ff-text-primary)] mb-2">Ticket Form</h2>
          <p className="text-[var(--ff-text-secondary)] mb-4">
            Ticket creation form will be integrated here
          </p>
          <div className="text-sm text-[var(--ff-text-tertiary)]">
            {/* 🔵 MOCK: TicketForm component will be implemented with full form functionality */}
            <p className="mb-2">Form will include:</p>
            <ul className="text-left max-w-md mx-auto space-y-1">
              <li>• Source selection (QContact, Weekly Report, Manual, etc.)</li>
              <li>• DR number lookup with auto-population</li>
              <li>• Location details (Zone, Pole, PON)</li>
              <li>• Equipment information (ONT serial, RX level)</li>
              <li>• Assignment to technicians/contractors</li>
              <li>• Priority and SLA configuration</li>
              <li>• Fault cause classification (for maintenance)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
