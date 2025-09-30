/**
 * BulkApplicationActions - Bulk action buttons and confirmation for applications
 * Handles bulk approve and reject operations
 * Extracted from ApplicationActions.tsx for constitutional compliance
 */

import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useBulkApplicationActions } from '../../../hooks/useApplicationActions';

interface BulkApplicationActionsProps {
  selectedContractorIds: string[];
  onActionComplete?: () => void;
}

const REJECTION_REASONS = [
  { value: 'incomplete_documentation', label: 'Incomplete Documentation' },
  { value: 'invalid_credentials', label: 'Invalid Credentials' },
  { value: 'failed_verification', label: 'Failed Verification' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' }
];

export function BulkApplicationActions({
  selectedContractorIds,
  onActionComplete
}: BulkApplicationActionsProps) {
  const {
    isLoading,
    confirmation,
    actions
  } = useBulkApplicationActions({
    selectedContractorIds,
    onActionComplete
  });

  if (selectedContractorIds.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">
            {selectedContractorIds.length} application{selectedContractorIds.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => actions.handleBulkAction('approve')}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>Approve All</span>
            </button>
            
            <button
              onClick={() => actions.handleBulkAction('reject')}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span>Reject All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Confirmation Modal */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {confirmation.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                {confirmation.message}
              </p>

              {/* Reason Selection (for rejections) */}
              {confirmation.requiresReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={confirmation.reason || ''}
                    onChange={(e) => actions.setConfirmation({
                      ...confirmation,
                      reason: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    {REJECTION_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={confirmation.notes || ''}
                  onChange={(e) => actions.setConfirmation({
                    ...confirmation,
                    notes: e.target.value
                  })}
                  placeholder="Add any additional context..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => actions.setConfirmation({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => actions.executeBulkAction(
                  confirmation.action! as 'approve' | 'reject',
                  confirmation.reason,
                  confirmation.notes
                )}
                disabled={isLoading || (confirmation.requiresReason && !confirmation.reason)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : `${confirmation.action === 'approve' ? 'Approve' : 'Reject'} ${selectedContractorIds.length} Applications`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}