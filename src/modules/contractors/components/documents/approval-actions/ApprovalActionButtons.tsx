/**
 * ApprovalActionButtons - Quick approve and form trigger buttons
 * Split from ApprovalActions.tsx to meet constitutional requirements (<200 lines)
 * @module ApprovalActionButtons
 */

import React from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ApprovalActionButtonsProps {
  /**
   * Whether approval/rejection is in progress
   */
  isSubmitting: boolean;
  /**
   * Show quick approve button (no notes required)
   */
  allowQuickApprove: boolean;
  /**
   * Require notes for approval
   */
  requireApprovalNotes: boolean;
  /**
   * Use compact display mode
   */
  compact: boolean;
  /**
   * Handler for quick approve
   */
  onQuickApprove: () => void;
  /**
   * Handler to show approval form
   */
  onShowApprovalForm: () => void;
  /**
   * Handler to show rejection form
   */
  onShowRejectionForm: () => void;
}

/**
 * ApprovalActionButtons - Render action buttons for approve/reject
 */
export function ApprovalActionButtons({
  isSubmitting,
  allowQuickApprove,
  requireApprovalNotes,
  compact,
  onQuickApprove,
  onShowApprovalForm,
  onShowRejectionForm
}: ApprovalActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Quick Approve Button */}
      {allowQuickApprove && !requireApprovalNotes && (
        <button
          onClick={onQuickApprove}
          disabled={isSubmitting}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Approve document"
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="ml-1">Approve</span>
        </button>
      )}
      
      {/* Approve with Notes Button */}
      {(!allowQuickApprove || requireApprovalNotes) && (
        <button
          onClick={onShowApprovalForm}
          disabled={isSubmitting}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Approve with notes"
        >
          <Check className="w-4 h-4" />
          <span className="ml-1">Approve</span>
          {!compact && <ChevronDown className="w-3 h-3 ml-1" />}
        </button>
      )}
      
      {/* Reject Button */}
      <button
        onClick={onShowRejectionForm}
        disabled={isSubmitting}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Reject document"
      >
        <X className="w-4 h-4" />
        <span className="ml-1">Reject</span>
        {!compact && <ChevronDown className="w-3 h-3 ml-1" />}
      </button>
    </div>
  );
}