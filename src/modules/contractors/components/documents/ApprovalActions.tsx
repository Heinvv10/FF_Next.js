/**
 * ApprovalActions Component - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 580 lines to <200 lines by using hooks and sub-components
 * @module ApprovalActions
 */

import React from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentRejectionReason } from './types/documentApproval.types';
import { useApprovalActions } from '../../hooks/useApprovalActions';
import { QuickApprovalButton } from './approval-actions/QuickApprovalButton';
import { ApprovalFormModal } from './approval-actions/ApprovalFormModal';
import { RejectionFormModal } from './approval-actions/RejectionFormModal';
import { ApprovalActionButtons } from './approval-actions/ApprovalActionButtons';

interface ApprovalActionsProps {
  /**
   * Document to approve/reject
   */
  document: ContractorDocument;
  /**
   * Callback for document approval
   */
  onApprove: (notes?: string) => Promise<void> | void;
  /**
   * Callback for document rejection
   */
  onReject: (notes?: string, reason?: DocumentRejectionReason) => Promise<void> | void;
  /**
   * Whether approval/rejection is in progress
   */
  isProcessing?: boolean;
  /**
   * Show quick approve button (no notes required)
   */
  allowQuickApprove?: boolean;
  /**
   * Require notes for approval
   */
  requireApprovalNotes?: boolean;
  /**
   * Require notes for rejection
   */
  requireRejectionNotes?: boolean;
  /**
   * Maximum length for notes
   */
  maxNotesLength?: number;
  /**
   * Compact mode for inline display
   */
  compact?: boolean;
}

/**
 * ApprovalActions - Main component using composition pattern
 * Refactored from 580 lines to <200 lines for constitutional compliance
 * Business logic extracted to useApprovalActions hook
 */
export function ApprovalActions({
  document,
  onApprove,
  onReject,
  isProcessing = false,
  allowQuickApprove = true,
  requireApprovalNotes = false,
  requireRejectionNotes = true,
  maxNotesLength = 500,
  compact = false,
}: ApprovalActionsProps) {
  // Extract all business logic to custom hook
  const {
    // State
    showApprovalForm,
    showRejectionForm,
    approvalNotes,
    rejectionNotes,
    rejectionReason,
    isSubmitting,
    validationErrors,
    
    // Actions
    setShowApprovalForm,
    setShowRejectionForm,
    setApprovalNotes,
    setRejectionNotes,
    setRejectionReason,
    handleQuickApprove,
    handleApprovalSubmit,
    handleRejectionSubmit,
    handleCancel,
    validateInput,
    
    // UI helpers
    canApprove,
    canReject,
    hasErrors,
  } = useApprovalActions({
    document,
    onApprove,
    onReject,
    requireApprovalNotes,
    requireRejectionNotes,
    maxNotesLength,
  });

  // Handle external processing state
  const processing = isProcessing || isSubmitting;

  return (
    <div className={`approval-actions ${compact ? 'compact' : ''}`}>
      {/* Quick approve button - only if allowed and no form is open */}
      {allowQuickApprove && !showApprovalForm && !showRejectionForm && (
        <QuickApprovalButton
          document={document}
          onApprove={handleQuickApprove}
          disabled={processing || !canApprove}
          processing={processing}
        />
      )}

      {/* Main action buttons */}
      {!showApprovalForm && !showRejectionForm && (
        <ApprovalActionButtons
          document={document}
          onShowApprovalForm={() => setShowApprovalForm(true)}
          onShowRejectionForm={() => setShowRejectionForm(true)}
          canApprove={canApprove}
          canReject={canReject}
          disabled={processing}
          compact={compact}
        />
      )}

      {/* Approval form modal */}
      {showApprovalForm && (
        <ApprovalFormModal
          document={document}
          notes={approvalNotes}
          onNotesChange={setApprovalNotes}
          onSubmit={handleApprovalSubmit}
          onCancel={handleCancel}
          processing={processing}
          validationErrors={validationErrors}
          requireNotes={requireApprovalNotes}
          maxLength={maxNotesLength}
        />
      )}

      {/* Rejection form modal */}
      {showRejectionForm && (
        <RejectionFormModal
          document={document}
          notes={rejectionNotes}
          reason={rejectionReason}
          onNotesChange={setRejectionNotes}
          onReasonChange={setRejectionReason}
          onSubmit={handleRejectionSubmit}
          onCancel={handleCancel}
          processing={processing}
          validationErrors={validationErrors}
          requireNotes={requireRejectionNotes}
          maxLength={maxNotesLength}
        />
      )}

      {/* Error display */}
      {hasErrors && (
        <div className="approval-actions-errors mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {validationErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Default export for backward compatibility
 */
export default ApprovalActions;