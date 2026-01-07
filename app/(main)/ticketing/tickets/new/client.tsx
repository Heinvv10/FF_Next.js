'use client';

/**
 * Create Ticket Page Client Component
 *
 * Complete ticket creation form with all sections:
 * - Source & Classification (source, type, priority)
 * - Ticket Details (title, description, external ID)
 * - Location (DR lookup with auto-population)
 * - Equipment Information (ONT serial, RX level, model)
 * - Client Information (name, contact, email)
 * - Assignment (technician, contractor, team)
 * - Fault Attribution (maintenance tickets only)
 *
 * 🟢 WORKING: Production-ready ticket creation page
 */

import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { TicketForm } from '@/modules/ticketing/components/TicketForm';

export default function CreateTicketPageClient() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      <TicketForm />
    </div>
  );
}
