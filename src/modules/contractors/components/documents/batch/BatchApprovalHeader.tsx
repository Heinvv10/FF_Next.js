/**
 * BatchApprovalHeader - Header component for batch approval modal
 * Displays title, progress, and close action
 * Extracted from BatchApprovalModal.tsx for constitutional compliance
 */

import React from 'react';
import { X, Users, Check, XCircle } from 'lucide-react';

interface BatchApprovalHeaderProps {
  selectedAction: 'approve' | 'reject';
  selectedCount: number;
  totalCount: number;
  showConfirmation: boolean;
  isProcessing: boolean;
  onClose: () => void;
}

export function BatchApprovalHeader({
  selectedAction,
  selectedCount,
  totalCount,
  showConfirmation,
  isProcessing,
  onClose
}: BatchApprovalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {/* Action Icon */}
        <div className={`p-2 rounded-lg ${
          selectedAction === 'approve' 
            ? 'bg-green-100 text-green-600' 
            : 'bg-red-100 text-red-600'
        }`}>
          {selectedAction === 'approve' ? (
            <Check className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </div>

        {/* Title and Status */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {showConfirmation ? 'Confirm Batch Operation' : 'Batch Document Processing'}
          </h2>
          <p className="text-sm text-gray-600">
            {showConfirmation ? (
              `Review and confirm ${selectedAction} for ${selectedCount} document${selectedCount !== 1 ? 's' : ''}`
            ) : (
              `${selectedAction === 'approve' ? 'Approve' : 'Reject'} multiple documents at once`
            )}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-4">
        {/* Document Count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{selectedCount} of {totalCount}</span>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}