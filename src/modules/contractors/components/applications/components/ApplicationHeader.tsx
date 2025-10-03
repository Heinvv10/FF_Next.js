/**
 * Application Header Component
 * Header with actions for pending applications list
 * @module PendingApplicationsList
 */

import React from 'react';
import { RefreshCw, Download, CheckCircle, XCircle } from 'lucide-react';
import { ApplicationHeaderProps } from '../types/pendingApplicationsList.types';

export function ApplicationHeader({
  onRefresh,
  onExport,
  isLoading,
  selectedCount,
  totalApplications
}: ApplicationHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pending Applications</h2>
        <p className="text-gray-600 mt-1">
          {totalApplications} application{totalApplications !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {/* TODO: Implement bulk approve */}}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve Selected"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {/* TODO: Implement bulk reject */}}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject Selected"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onExport}
          disabled={totalApplications === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}