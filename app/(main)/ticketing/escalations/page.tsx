/**
 * Escalation Management Page
 *
 * Manages repeat fault escalations and infrastructure-level issues:
 * - Active escalations (pole, PON, zone, DR-level)
 * - Repeat fault patterns and detection
 * - Infrastructure ticket creation
 * - Escalation resolution tracking
 * - Fault trend visualization
 *
 * 🟢 WORKING: Escalation management page integrates escalation components
 */

export const dynamic = 'force-dynamic';

'use client';

import { EscalationList } from '@/modules/ticketing/components/Escalation/EscalationList';
import { EscalationAlert } from '@/modules/ticketing/components/Escalation/EscalationAlert';
import { RepeatFaultMap } from '@/modules/ticketing/components/Escalation/RepeatFaultMap';
import { useState } from 'react';

export default function EscalationsPage() {
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Escalation Management</h1>
        <p className="text-gray-600">
          Track and resolve repeat faults and infrastructure-level issues
        </p>
      </div>

      {/* Escalation Alerts - High priority warnings */}
      <div className="mb-6">
        <EscalationAlert />
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setActiveView('list')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Escalation List
        </button>
        <button
          onClick={() => setActiveView('map')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'map'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Fault Map
        </button>
      </div>

      {/* Content Area */}
      {activeView === 'list' ? (
        <EscalationList />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Repeat Fault Patterns</h2>
          <RepeatFaultMap />
        </div>
      )}
    </div>
  );
}
