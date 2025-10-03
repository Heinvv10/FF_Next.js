/**
 * Pending Applications List Component - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 482 lines to <200 lines by using hooks and sub-components
 * @module PendingApplicationsList
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PendingApplicationsListProps } from './types/pendingApplicationsList.types';
import { usePendingApplicationsList } from '../../hooks/usePendingApplicationsList';
import { QuickStatsGrid } from './components/QuickStatsGrid';
import { ApplicationHeader } from './components/ApplicationHeader';
import { PendingApplicationsTable } from './components/PendingApplicationsTable';

/**
 * Pending Applications List Component - Refactored (Main orchestrator)
 */
export function PendingApplicationsList(props: PendingApplicationsListProps) {
  // Use custom hook for business logic
  const hookState = usePendingApplicationsList(props);

  const {
    applications,
    isLoading,
    error,
    selectedIds,
    quickStats,
    handleApplicationSelect,
    handleSelectAll,
    handleBulkApprove,
    handleBulkReject,
    handleExport,
    handleRefresh,
    clearError,
    loadApplications
  } = hookState;

  // Handle application navigation
  const handleViewApplication = (application: any) => {
    // TODO: Navigate to application details
    console.log('View application:', application.id);
  };

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-red-900 mb-1">Error Loading Applications</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={clearError}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Dismiss
          </button>
          <button
            onClick={() => loadApplications()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render - delegating to specialized components
  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <QuickStatsGrid stats={quickStats} />

      {/* Header with actions */}
      <ApplicationHeader
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
        selectedCount={selectedIds.length}
        totalApplications={applications.length}
      />

      {/* Applications Table */}
      <PendingApplicationsTable
        applications={applications}
        selectedIds={selectedIds}
        onApplicationSelect={handleApplicationSelect}
        onSelectAll={handleSelectAll}
        onApplicationView={handleViewApplication}
      />

      {/* Bulk Actions Footer */}
      {selectedIds.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedIds.length} application{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700"
              >
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700"
              >
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && applications.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default PendingApplicationsList;