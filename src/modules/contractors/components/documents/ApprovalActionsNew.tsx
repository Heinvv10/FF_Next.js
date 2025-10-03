/**
 * ApprovalActions Component - Refactored main component
 * Split from original 580-line component to meet constitutional requirements (<200 lines)
 * @module ApprovalActions
 */

import React, { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentRejectionReason } from './types/documentApproval.types';
import { useApprovalActions } from '../../hooks/useApprovalActions';

// Sub-components
import { PriorityIndicator } from './approval-actions/PriorityIndicator';
import { ApprovalActionButtons } from './approval-actions/ApprovalActionButtons';
import { ApprovalForm } from './approval-actions/ApprovalForm';
import { RejectionForm } from './approval-actions/RejectionForm';

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
   * Use compact display mode
   */
  compact?: boolean;
}

/**
 * ApprovalActions - Interactive approval/rejection controls
 * Refactored to use composition pattern with focused sub-components
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
  compact = false
}: ApprovalActionsProps) {
  // Use custom hook for business logic
  const {
    // State
    showApprovalForm,
    showRejectionForm,
    approvalNotes,
    rejectionNotes,
    rejectionReason,
    isSubmitting,
    validationErrors,
    
    // Refs
    approvalFormRef,
    rejectionFormRef,
    approvalNotesRef,
    rejectionNotesRef,
    
    // Actions
    handleQuickApprove,
    handleApprovalSubmit,
    handleRejectionSubmit,
    showApprovalFormHandler,
    showRejectionFormHandler,
    resetForms,
    
    // Setters
    setApprovalNotes,
    setRejectionNotes,
    setRejectionReason,
  } = useApprovalActions({
    document,
    onApprove,
    onReject,
    requireApprovalNotes,
    requireRejectionNotes,
    maxNotesLength
  });

  // Close forms when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        approvalFormRef.current &&
        !approvalFormRef.current.contains(event.target as Node) &&
        rejectionFormRef.current &&
        !rejectionFormRef.current.contains(event.target as Node)
      ) {
        resetForms();
      }
    };

    if (showApprovalForm || showRejectionForm) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showApprovalForm, showRejectionForm, resetForms, approvalFormRef, rejectionFormRef]);

  // Show processing state
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Processing...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Priority and urgency indicators */}
      {!compact && <PriorityIndicator document={document} />}
      
      {/* Main action buttons */}
      {!showApprovalForm && !showRejectionForm && (
        <ApprovalActionButtons
          isSubmitting={isSubmitting}
          allowQuickApprove={allowQuickApprove}
          requireApprovalNotes={requireApprovalNotes}
          compact={compact}
          onQuickApprove={handleQuickApprove}
          onShowApprovalForm={showApprovalFormHandler}
          onShowRejectionForm={showRejectionFormHandler}
        />
      )}

      {/* Approval form */}
      {showApprovalForm && (
        <ApprovalForm
          formRef={approvalFormRef}
          notesRef={approvalNotesRef}
          notes={approvalNotes}
          requireNotes={requireApprovalNotes}
          maxNotesLength={maxNotesLength}
          isSubmitting={isSubmitting}
          validationErrors={validationErrors}
          onNotesChange={setApprovalNotes}
          onSubmit={handleApprovalSubmit}
          onCancel={resetForms}
        />
      )}

      {/* Rejection form */}
      {showRejectionForm && (
        <RejectionForm
          formRef={rejectionFormRef}
          notesRef={rejectionNotesRef}
          notes={rejectionNotes}
          rejectionReason={rejectionReason}
          requireNotes={requireRejectionNotes}
          maxNotesLength={maxNotesLength}
          isSubmitting={isSubmitting}
          validationErrors={validationErrors}
          onNotesChange={setRejectionNotes}
          onReasonChange={setRejectionReason}
          onSubmit={handleRejectionSubmit}
          onCancel={resetForms}
        />
      )}
    </div>
  );
}