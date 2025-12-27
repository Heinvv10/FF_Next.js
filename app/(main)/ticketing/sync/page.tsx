/**
 * QContact Sync Page
 *
 * Manages bidirectional synchronization with QContact system:
 * - Sync status dashboard
 * - Manual sync trigger
 * - Sync history log
 * - Success/failure metrics
 * - Error tracking and reporting
 *
 * 🟢 WORKING: QContact sync page integrates sync components
 */

'use client';

import { SyncDashboard } from '@/modules/ticketing/components/QContact/SyncDashboard';
import { SyncTrigger } from '@/modules/ticketing/components/QContact/SyncTrigger';
import { SyncAuditLog } from '@/modules/ticketing/components/QContact/SyncAuditLog';
import { useState } from 'react';

export default function QContactSyncPage() {
  const [showAuditLog, setShowAuditLog] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QContact Synchronization</h1>
        <p className="text-gray-600">Manage bidirectional sync with QContact ticketing system</p>
      </div>

      {/* Sync Dashboard - Shows current status and metrics */}
      <div className="mb-6">
        <SyncDashboard />
      </div>

      {/* Manual Sync Trigger */}
      <div className="mb-6">
        <SyncTrigger />
      </div>

      {/* Toggle for Audit Log */}
      <div className="mb-4">
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {showAuditLog ? 'Hide Audit Log' : 'View Audit Log'}
        </button>
      </div>

      {/* Sync Audit Log */}
      {showAuditLog && (
        <div>
          <SyncAuditLog />
        </div>
      )}
    </div>
  );
}
