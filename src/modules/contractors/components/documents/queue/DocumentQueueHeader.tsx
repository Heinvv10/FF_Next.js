/**
 * DocumentQueueHeader - Header component for document approval queue
 * Displays statistics, actions, and queue controls
 * Extracted from DocumentApprovalQueue.tsx for constitutional compliance
 */

import React from 'react';
import { RefreshCw, CheckCheck, Users, BarChart3 } from 'lucide-react';
import { DocumentQueueStats } from '../types/documentApproval.types';

interface DocumentQueueHeaderProps {
  stats: DocumentQueueStats;
  selectedCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onBulkApprove: () => void;
  onComplianceTracker: () => void;
  enableBatchOperations?: boolean;
}

export function DocumentQueueHeader({
  stats,
  selectedCount,
  isRefreshing,
  onRefresh,
  onBulkApprove,
  onComplianceTracker,
  enableBatchOperations = true
}: DocumentQueueHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and Description */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Document Approval Queue
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve contractor documents for compliance verification
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Bulk Approve Button */}
          {enableBatchOperations && selectedCount > 0 && (
            <button
              onClick={onBulkApprove}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Approve Selected ({selectedCount})
            </button>
          )}

          {/* Compliance Tracker Button */}
          <button
            onClick={onComplianceTracker}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Compliance Tracker
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Documents</div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-yellow-600">Pending Review</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-green-600">Approved</div>
        </div>

        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-700">{stats.expired}</div>
          <div className="text-xs text-orange-600">Expired</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-700">{stats.expiringWithin30Days}</div>
          <div className="text-xs text-purple-600">Expiring Soon</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{stats.queuedToday}</div>
          <div className="text-xs text-blue-600">Queued Today</div>
        </div>

        <div className="bg-teal-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-teal-700">{stats.processedToday}</div>
          <div className="text-xs text-teal-600">Processed Today</div>
        </div>
      </div>

      {/* Quick Insights */}
      {stats.total > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Users className="w-4 h-4" />
            <span className="font-medium">Queue Insights</span>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            {stats.pending > 0 && (
              <div>• {stats.pending} documents awaiting review</div>
            )}
            {stats.expiringWithin30Days > 0 && (
              <div>• {stats.expiringWithin30Days} documents expiring within 30 days</div>
            )}
            {stats.expired > 0 && (
              <div>• {stats.expired} expired documents need attention</div>
            )}
            {stats.pending === 0 && stats.expired === 0 && stats.expiringWithin30Days === 0 && (
              <div>• All documents are up to date</div>
            )}
          </div>
        </div>
      )}

      {/* Empty State Message */}
      {stats.total === 0 && (
        <div className="mt-4 p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <div className="font-medium">No documents in queue</div>
          <div className="text-sm">Documents will appear here when contractors upload compliance documents</div>
        </div>
      )}
    </div>
  );
}