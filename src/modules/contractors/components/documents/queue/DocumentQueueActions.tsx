/**
 * DocumentQueueActions - Action controls for document queue operations
 * Handles bulk operations and batch actions
 * Extracted from DocumentApprovalQueue.tsx for constitutional compliance
 */

import React from 'react';
import { CheckCheck, X, Download, Archive } from 'lucide-react';

interface DocumentQueueActionsProps {
  selectedDocuments: Set<string>;
  isProcessing: boolean;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onExportSelected: () => void;
  onClearSelection: () => void;
}

export function DocumentQueueActions({
  selectedDocuments,
  isProcessing,
  onBulkApprove,
  onBulkReject,
  onExportSelected,
  onClearSelection
}: DocumentQueueActionsProps) {
  const selectedCount = selectedDocuments.size;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-900">
            {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear selection
          </button>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Approve */}
          <button
            onClick={onBulkApprove}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {isProcessing ? 'Processing...' : 'Approve Selected'}
          </button>

          {/* Bulk Reject */}
          <button
            onClick={onBulkReject}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Reject Selected
          </button>

          {/* Export Selected */}
          <button
            onClick={onExportSelected}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Selected
          </button>

          {/* Archive Selected */}
          <button
            onClick={() => {
              // TODO: Implement archive functionality
              console.log('Archive selected documents:', Array.from(selectedDocuments));
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Archive Selected
          </button>
        </div>
      </div>

      {/* Batch Operation Status */}
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            <span className="font-medium">Processing {selectedCount} documents...</span>
          </div>
          <div className="mt-1 text-sm text-blue-600">
            This may take a few moments. Please do not refresh the page.
          </div>
        </div>
      )}

      {/* Quick Actions Info */}
      <div className="mt-4 text-xs text-gray-500">
        <div>
          <strong>Tip:</strong> Use Shift+Click to select multiple documents quickly, or use the header checkbox to select all visible documents.
        </div>
      </div>
    </div>
  );
}