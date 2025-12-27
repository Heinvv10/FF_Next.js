/**
 * Weekly Import Page
 *
 * Handles weekly Excel report imports with:
 * - Excel file upload wizard
 * - File validation and preview
 * - Import progress tracking
 * - Import results and statistics
 * - Error handling and reporting
 * - Import history
 *
 * 🟢 WORKING: Weekly import page integrates WeeklyImportWizard component
 */

'use client';

import { WeeklyImportWizard } from '@/modules/ticketing/components/WeeklyImport/WeeklyImportWizard';
import { useState } from 'react';

export default function WeeklyImportPage() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Report Import</h1>
        <p className="text-gray-600">Import weekly maintenance reports from Excel files</p>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {showHistory ? 'Hide History' : 'View Import History'}
        </button>
      </div>

      {showHistory ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Import History</h2>
          <p className="text-gray-500">Import history will be displayed here</p>
          {/* 🔵 MOCK: Import history list will be implemented with API integration */}
        </div>
      ) : (
        <WeeklyImportWizard />
      )}
    </div>
  );
}
