/**
 * ApplicationConfirmationModal - Confirmation dialog for application actions
 * Handles action confirmation with optional reason and notes
 * Extracted from ApplicationActions.tsx for constitutional compliance
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ApprovalAction } from '@/types/contractor.types';

interface ConfirmationState {
  isOpen: boolean;
  action?: ApprovalAction;
  title?: string;
  message?: string;
  requiresReason?: boolean;
  reason?: string;
  notes?: string;
}

interface ApplicationConfirmationModalProps {
  confirmation: ConfirmationState;
  isLoading: boolean;
  onConfirm: (action: ApprovalAction, reason?: string, notes?: string) => void;
  onCancel: () => void;
  onUpdateConfirmation: (confirmation: ConfirmationState) => void;
}

const REJECTION_REASONS = [
  { value: 'incomplete_documentation', label: 'Incomplete Documentation' },
  { value: 'invalid_credentials', label: 'Invalid Credentials' },
  { value: 'failed_verification', label: 'Failed Verification' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' }
];

export function ApplicationConfirmationModal({
  confirmation,
  isLoading,
  onConfirm,
  onCancel,
  onUpdateConfirmation
}: ApplicationConfirmationModalProps) {
  if (!confirmation.isOpen || !confirmation.action) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(confirmation.action!, confirmation.reason, confirmation.notes);
  };

  const canConfirm = !confirmation.requiresReason || confirmation.reason;

  return (
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

          {/* Reason Selection (for actions that require it) */}
          {confirmation.requiresReason && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={confirmation.reason || ''}
                onChange={(e) => onUpdateConfirmation({
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
              onChange={(e) => onUpdateConfirmation({
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
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}