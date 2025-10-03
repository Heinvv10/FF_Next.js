/**
 * RejectionForm - Document rejection form with reason and notes
 * Split from ApprovalActions.tsx to meet constitutional requirements (<200 lines)
 * @module RejectionForm
 */

import React from 'react';
import { X, AlertCircle, FileX } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DocumentRejectionReason } from '../types/documentApproval.types';
import { REJECTION_REASONS } from '../../../utils/approvalUtils';

interface RejectionFormProps {
  /**
   * Reference to the form container
   */
  formRef: React.RefObject<HTMLDivElement>;
  /**
   * Reference to the notes textarea
   */
  notesRef: React.RefObject<HTMLTextAreaElement>;
  /**
   * Current notes value
   */
  notes: string;
  /**
   * Current rejection reason
   */
  rejectionReason: DocumentRejectionReason;
  /**
   * Whether notes are required
   */
  requireNotes: boolean;
  /**
   * Maximum notes length
   */
  maxNotesLength: number;
  /**
   * Whether form is submitting
   */
  isSubmitting: boolean;
  /**
   * Validation errors to display
   */
  validationErrors: string[];
  /**
   * Handler for notes change
   */
  onNotesChange: (value: string) => void;
  /**
   * Handler for rejection reason change
   */
  onReasonChange: (reason: DocumentRejectionReason) => void;
  /**
   * Handler for form submission
   */
  onSubmit: (e: React.FormEvent) => void;
  /**
   * Handler for cancel action
   */
  onCancel: () => void;
}

/**
 * RejectionForm - Render rejection form with reason selection and notes
 */
export function RejectionForm({
  formRef,
  notesRef,
  notes,
  rejectionReason,
  requireNotes,
  maxNotesLength,
  isSubmitting,
  validationErrors,
  onNotesChange,
  onReasonChange,
  onSubmit,
  onCancel
}: RejectionFormProps) {
  const selectedReason = REJECTION_REASONS.find(r => r.value === rejectionReason);
  const notesRequired = requireNotes || rejectionReason === 'other';
  
  return (
    <div
      ref={formRef}
      className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-96"
    >
      <form onSubmit={onSubmit}>
        <div className="flex items-center gap-2 mb-3">
          <X className="w-5 h-5 text-red-600" />
          <h4 className="text-sm font-semibold text-gray-900">Reject Document</h4>
        </div>
        
        {validationErrors.length > 0 && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Validation Errors</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason *
          </label>
          <select
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value as DocumentRejectionReason)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            {REJECTION_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {selectedReason?.description}
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="rejection-notes" className="block text-sm font-medium text-gray-700 mb-1">
            {notesRequired ? 'Additional Notes *' : 'Additional Notes (Optional)'}
          </label>
          <textarea
            ref={notesRef}
            id="rejection-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={`Please provide ${rejectionReason === 'other' ? 'specific details about the rejection' : 'additional context for this rejection'}...`}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            rows={3}
            maxLength={maxNotesLength}
            required={notesRequired}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {notes.length}/{maxNotesLength} characters
            </span>
            {notesRequired && (
              <span className="text-xs text-red-500">* Required</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="text-white mr-2" />
            ) : (
              <FileX className="w-4 h-4 mr-2" />
            )}
            Reject Document
          </button>
        </div>
      </form>
    </div>
  );
}