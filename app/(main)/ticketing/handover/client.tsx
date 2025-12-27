'use client';

/**
 * Handover Center Page Client Component
 *
 * Manages ticket handover process between teams:
 * - Tickets pending handover (Build → QA, QA → Maintenance)
 * - Handover wizard for creating immutable snapshots
 * - Handover history and audit trail
 * - Ownership tracking
 * - Validation gate checks
 *
 * 🟢 WORKING: Handover center page integrates handover components
 */

import { HandoverWizard } from '@/modules/ticketing/components/Handover/HandoverWizard';
import { HandoverHistory } from '@/modules/ticketing/components/Handover/HandoverHistory';
import { useState } from 'react';

export default function HandoverCenterPageClient() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handover Center</h1>
        <p className="text-gray-600">Manage ticket handovers between Build, QA, and Maintenance teams</p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowHistory(false)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !showHistory
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Create Handover
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showHistory
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          View History
        </button>
      </div>

      {/* Content Area */}
      {showHistory ? (
        <HandoverHistory />
      ) : (
        <div>
          {/* Pending Handovers List */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Tickets Pending Handover</h2>
            <p className="text-gray-500">
              Select a ticket to create a handover snapshot
            </p>
            {/* 🔵 MOCK: Pending tickets list will be implemented with API integration */}
          </div>

          {/* Handover Wizard */}
          {selectedTicketId && (
            <HandoverWizard
              ticketId={selectedTicketId}
              onComplete={() => setSelectedTicketId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
