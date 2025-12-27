/**
 * Create Ticket Page
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

'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CreateTicketPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/ticketing/tickets"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
            <p className="text-gray-600">Create a new ticketing record for fiber network issues</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ticket Form</h2>
          <p className="text-gray-600 mb-4">
            Ticket creation form will be integrated here
          </p>
          <div className="text-sm text-gray-500">
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
