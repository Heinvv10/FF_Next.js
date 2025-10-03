/**
 * RejectionFormModal - Modal for rejection with reason and notes
 * Extracted from ApprovalActions for constitutional compliance
 * Focused component <200 lines
 */

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentRejectionReason } from '../types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RejectionFormModalProps {
  document: ContractorDocument;
  notes: string;
  reason: DocumentRejectionReason;
  onNotesChange: (notes: string) => void;
  onReasonChange: (reason: DocumentRejectionReason) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  processing: boolean;
  validationErrors: string[];
  requireNotes: boolean;
  maxLength: number;
}

const REJECTION_REASONS: { value: DocumentRejectionReason; label: string }[] = [
  { value: 'expired', label: 'Expired Document' },
  { value: 'invalid_format', label: 'Invalid Format' },
  { value: 'poor_quality', label: 'Poor Quality' },
  { value: 'incomplete_information', label: 'Incomplete Information' },
  { value: 'incorrect_document_type', label: 'Incorrect Document Type' },
  { value: 'missing_signature', label: 'Missing Signature' },
  { value: 'invalid_issuer', label: 'Invalid Issuer' },
  { value: 'duplicate', label: 'Duplicate Document' },
  { value: 'compliance_issue', label: 'Compliance Issue' },
  { value: 'other', label: 'Other (specify in notes)' },
];

export function RejectionFormModal({
  document,
  notes,
  reason,
  onNotesChange,
  onReasonChange,
  onSubmit,
  onCancel,
  processing,
  validationErrors,
  requireNotes,
  maxLength,
}: RejectionFormModalProps) {
  const hasValidationError = validationErrors.length > 0;

  return (
    <div className="rejection-form-modal bg-white border border-gray-200 rounded-lg p-4 mt-2 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h4 className="text-lg font-medium text-gray-900">
          Reject Document: {document.name}
        </h4>
      </div>

      <div className="space-y-4">
        {/* Rejection reason */}
        <div>
          <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <select
            id="rejection-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value as DocumentRejectionReason)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={processing}
          >
            {REJECTION_REASONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Rejection notes */}
        <div>
          <label htmlFor="rejection-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Notes {requireNotes && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="rejection-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={requireNotes ? "Please provide rejection details..." : "Optional rejection notes..."}
            rows={4}
            maxLength={maxLength}
            className={`
              w-full px-3 py-2 border rounded-md text-sm resize-none
              ${hasValidationError ? 'border-red-300' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            `}
            disabled={processing}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {notes.length}/{maxLength} characters
            </span>
            {notes.length > maxLength * 0.9 && (
              <span className="text-xs text-orange-600">
                Approaching character limit
              </span>
            )}
          </div>
        </div>

        {/* Validation errors */}
        {hasValidationError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onSubmit}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {processing ? 'Rejecting...' : 'Reject Document'}
          </button>

          <button
            onClick={onCancel}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 focus:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}