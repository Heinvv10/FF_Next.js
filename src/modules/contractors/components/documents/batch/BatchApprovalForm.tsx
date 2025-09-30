/**
 * BatchApprovalForm - Form controls for batch approval operations
 * Handles action selection, rejection reasons, and notes
 * Extracted from BatchApprovalModal.tsx for constitutional compliance
 */

import React from 'react';
import { Check, XCircle, AlertTriangle } from 'lucide-react';
import { DocumentRejectionReason } from '../types/documentApproval.types';

interface BatchApprovalFormProps {
  selectedAction: 'approve' | 'reject';
  rejectionReason: string;
  notes: string;
  validationErrors: string[];
  rejectionReasons: DocumentRejectionReason[];
  onActionChange: (action: 'approve' | 'reject') => void;
  onRejectionReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
}

export function BatchApprovalForm({
  selectedAction,
  rejectionReason,
  notes,
  validationErrors,
  rejectionReasons,
  onActionChange,
  onRejectionReasonChange,
  onNotesChange
}: BatchApprovalFormProps) {
  return (
    <div className="space-y-6">
      {/* Action Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-3">
          Select Action
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Approve Option */}
          <button
            onClick={() => onActionChange('approve')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedAction === 'approve'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">Approve All</span>
            </div>
            <p className="text-xs mt-1 opacity-75">
              Mark documents as approved
            </p>
          </button>

          {/* Reject Option */}
          <button
            onClick={() => onActionChange('reject')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedAction === 'reject'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Reject All</span>
            </div>
            <p className="text-xs mt-1 opacity-75">
              Mark documents as rejected
            </p>
          </button>
        </div>
      </div>

      {/* Rejection Reason (shown only when rejecting) */}
      {selectedAction === 'reject' && (
        <div>
          <label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700 block mb-2">
            Rejection Reason *
          </label>
          <select
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select a rejection reason</option>
            {rejectionReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="batch-notes" className="text-sm font-medium text-gray-700 block mb-2">
          Notes {selectedAction === 'reject' && rejectionReason === 'other' && (
            <span className="text-red-500">*</span>
          )}
        </label>
        <textarea
          id="batch-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={
            selectedAction === 'approve'
              ? "Add any notes for this approval (optional)"
              : rejectionReason === 'other'
              ? "Please specify the rejection reason"
              : "Add any additional notes (optional)"
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          {selectedAction === 'reject' && rejectionReason === 'other'
            ? 'Notes are required when selecting "Other" as rejection reason'
            : 'These notes will be attached to all processed documents'
          }
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Please fix the following issues:</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-1">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Summary */}
      <div className={`p-4 rounded-lg border ${
        selectedAction === 'approve'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className={`text-sm font-medium ${
          selectedAction === 'approve' ? 'text-green-800' : 'text-red-800'
        }`}>
          {selectedAction === 'approve' ? '✓' : '✗'} Action Summary
        </div>
        <p className={`text-sm mt-1 ${
          selectedAction === 'approve' ? 'text-green-700' : 'text-red-700'
        }`}>
          All selected documents will be marked as{' '}
          <strong>{selectedAction === 'approve' ? 'approved' : 'rejected'}</strong>
          {selectedAction === 'reject' && rejectionReason && (
            <span> with reason: <strong>
              {rejectionReasons.find(r => r.value === rejectionReason)?.label}
            </strong></span>
          )}
          {notes.trim() && (
            <span> and the provided notes will be attached.</span>
          )}
        </p>
      </div>
    </div>
  );
}