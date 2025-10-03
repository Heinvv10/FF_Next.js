/**
 * ApprovalFormModal - Modal for approval with notes
 * Extracted from ApprovalActions for constitutional compliance
 * Focused component <150 lines
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ApprovalFormModalProps {
  document: ContractorDocument;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  processing: boolean;
  validationErrors: string[];
  requireNotes: boolean;
  maxLength: number;
}

export function ApprovalFormModal({
  document,
  notes,
  onNotesChange,
  onSubmit,
  onCancel,
  processing,
  validationErrors,
  requireNotes,
  maxLength,
}: ApprovalFormModalProps) {
  const hasValidationError = validationErrors.length > 0;

  return (
    <div className="approval-form-modal bg-white border border-gray-200 rounded-lg p-4 mt-2 shadow-sm">
      <h4 className="text-lg font-medium text-gray-900 mb-3">
        Approve Document: {document.name}
      </h4>

      <div className="space-y-3">
        {/* Notes textarea */}
        <div>
          <label htmlFor="approval-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Approval Notes {requireNotes && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="approval-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={requireNotes ? "Please provide approval notes..." : "Optional approval notes..."}
            rows={3}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {processing ? 'Approving...' : 'Approve Document'}
          </button>

          <button
            onClick={onCancel}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 focus:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}