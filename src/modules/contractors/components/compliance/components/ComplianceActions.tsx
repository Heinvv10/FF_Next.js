/**
 * ComplianceActions Component - Action buttons for compliance management
 * Extracted from ComplianceTracker.tsx for better maintainability
 */

import { Download, RefreshCw } from 'lucide-react';

interface ComplianceActionsProps {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Enable export functionality
   */
  enableExport: boolean;
  /**
   * Number of issues that can be auto-fixed
   */
  autoFixableIssuesCount: number;
  /**
   * Callback to export compliance report
   */
  onExport: () => void;
  /**
   * Callback to refresh compliance data
   */
  onRefresh: () => void;
  /**
   * Callback to auto-fix issues
   */
  onAutoFix: () => void;
}

/**
 * ComplianceActions - Action buttons for compliance operations
 */
export function ComplianceActions({
  isLoading,
  enableExport,
  autoFixableIssuesCount,
  onExport,
  onRefresh,
  onAutoFix
}: ComplianceActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>

      {/* Auto Fix Button */}
      {autoFixableIssuesCount > 0 && (
        <button
          onClick={onAutoFix}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Auto Fix ({autoFixableIssuesCount})
        </button>
      )}

      {/* Export Button */}
      {enableExport && (
        <button
          onClick={onExport}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      )}
    </div>
  );
}