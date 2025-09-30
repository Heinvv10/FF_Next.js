/**
 * ApplicationTable Component - Refactored for constitutional compliance
 * Main table component that orchestrates header, rows, and business logic
 * Original 612 lines → 150 lines (75% reduction)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ApplicationSummary, ApprovalAction, ApprovalActionResult } from '@/types/contractor.types';
import { useApplicationTable } from '../../hooks/applications/useApplicationTable';
import { ApplicationTableHeader } from './table/ApplicationTableHeader';
import { ApplicationTableRow } from './table/ApplicationTableRow';

interface ApplicationTableProps {
  /** Array of application summaries to display */
  applications: ApplicationSummary[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Selected application IDs for bulk operations */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Callback for individual actions */
  onAction?: (contractorId: string, action: ApprovalAction, data?: any) => Promise<ApprovalActionResult>;
  /** Callback for viewing application details */
  onView?: (contractorId: string) => void;
  /** Callback for editing application */
  onEdit?: (contractorId: string) => void;
  /** Current sort configuration */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Callback when sort changes */
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export function ApplicationTable({
  applications,
  isLoading = false,
  error = null,
  selectedIds = [],
  onSelectionChange,
  onAction,
  onView,
  onEdit,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = 'No applications found',
  className = ''
}: ApplicationTableProps) {
  
  // Business logic hook - extracted for constitutional compliance
  const {
    expandedRows,
    sortedApplications,
    handleSort,
    handleSelectAll,
    toggleRowExpansion,
    getStatusDisplay,
    formatDate,
    getDaysInReview
  } = useApplicationTable({
    applications,
    sortBy,
    sortOrder,
    onSort,
    onSelectionChange
  });

  // Enhanced row selection handler with proper selected IDs tracking
  const handleRowSelection = (applicationId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelectedIds = selected 
      ? [...selectedIds, applicationId]
      : selectedIds.filter(id => id !== applicationId);
    
    onSelectionChange(newSelectedIds);
  };

  // Table column definitions
  const columns: TableColumn[] = [
    { key: 'company', label: 'Company', sortable: true, width: '250px' },
    { key: 'contact', label: 'Contact', sortable: true, width: '200px' },
    { key: 'status', label: 'Status', sortable: true, width: '140px', align: 'center' },
    { key: 'applicationDate', label: 'Applied', sortable: true, width: '120px', align: 'center' },
    { key: 'progress', label: 'Progress', sortable: true, width: '120px', align: 'center' },
    { key: 'actions', label: 'Actions', sortable: false, width: '200px', align: 'center' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading applications</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No applications found</div>
          <div className="text-gray-400 text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <ApplicationTableHeader
            columns={columns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            selectedIds={selectedIds}
            applications={applications}
            onSelectAll={handleSelectAll}
          />

          <tbody className="bg-white divide-y divide-gray-200">
            {sortedApplications.map((application) => (
              <ApplicationTableRow
                key={application.id}
                application={application}
                isSelected={selectedIds.includes(application.id)}
                isExpanded={expandedRows.has(application.id)}
                selectedIds={selectedIds}
                onRowSelection={handleRowSelection}
                onView={onView}
                onAction={onAction}
                toggleRowExpansion={toggleRowExpansion}
                getStatusDisplay={getStatusDisplay}
                formatDate={formatDate}
                getDaysInReview={getDaysInReview}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}