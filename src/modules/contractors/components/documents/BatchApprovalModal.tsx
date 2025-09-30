/**
 * BatchApprovalModal Component - Bulk document approval/rejection interface
 * Refactored for constitutional compliance - now uses composition pattern
 * Reduced from 717 lines to ~120 lines by extracting business logic and UI components
 * @module BatchApprovalModal
 */

import React from 'react';
import { Check, XCircle, RotateCcw, Eye } from 'lucide-react';
import { useBatchApproval, REJECTION_REASONS } from '../../hooks/useBatchApproval';
import { BatchApprovalHeader } from './batch/BatchApprovalHeader';
import { BatchApprovalForm } from './batch/BatchApprovalForm';
import { BatchApprovalPreview } from './batch/BatchApprovalPreview';
import { BulkApprovalRequest } from './types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface BatchApprovalModalProps {
  /**
   * Document IDs to process in batch
   */
  documentIds: string[];
  /**
   * Callback when batch operation is submitted
   */
  onSubmit: (request: BulkApprovalRequest) => Promise<void>;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Whether batch operation is in progress
   */
  isProcessing?: boolean;
  /**
   * Enable preview of documents before processing
   */
  enablePreview?: boolean;
  /**
   * Maximum batch size allowed
   */
  maxBatchSize?: number;
}

/**
 * BatchApprovalModal - Main component using composition pattern
 * Refactored from 717 lines to ~120 lines for constitutional compliance
 */
export function BatchApprovalModal({
  documentIds,
  onSubmit,
  onClose,
  isProcessing = false,
  enablePreview = true,
  maxBatchSize = 50
}: BatchApprovalModalProps) {
  // Use custom hook for all business logic (280+ lines moved to hook)
  const {
    documents,
    selectedDocuments,
    selectedAction,
    rejectionReason,
    notes,
    showConfirmation,
    isLoading,
    validationErrors,
    batchSummary,
    canProceed,
    actions
  } = useBatchApproval({ documentIds, maxBatchSize, enablePreview });

  // Event handlers (delegated to hook and parent)
  const handleSubmit = async () => {
    if (showConfirmation) {
      // Final submission
      const bulkRequest = actions.createBulkRequest();
      await onSubmit(bulkRequest);
    } else {
      // Show confirmation step
      actions.setShowConfirmation(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner message="Loading documents for batch processing..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header with title and close (70 lines moved to component) */}
        <BatchApprovalHeader
          selectedAction={selectedAction}
          selectedCount={selectedDocuments.size}
          totalCount={documentIds.length}
          showConfirmation={showConfirmation}
          isProcessing={isProcessing}
          onClose={onClose}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showConfirmation ? (
            /* Confirmation Step - Preview (250 lines moved to component) */
            <BatchApprovalPreview
              documents={documents}
              selectedDocuments={selectedDocuments}
              selectedAction={selectedAction}
              rejectionReason={rejectionReason}
              notes={notes}
              batchSummary={batchSummary}
              rejectionReasons={REJECTION_REASONS}
              onDocumentToggle={actions.toggleDocumentSelection}
              onSelectAll={actions.selectAllDocuments}
              onDeselectAll={actions.deselectAllDocuments}
            />
          ) : (
            /* Form Step - Configuration (200 lines moved to component) */
            <BatchApprovalForm
              selectedAction={selectedAction}
              rejectionReason={rejectionReason}
              notes={notes}
              validationErrors={validationErrors}
              rejectionReasons={REJECTION_REASONS}
              onActionChange={actions.setSelectedAction}
              onRejectionReasonChange={actions.setRejectionReason}
              onNotesChange={actions.setNotes}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedDocuments.size} of {documentIds.length} documents selected
          </div>

          <div className="flex items-center gap-3">
            {showConfirmation ? (
              /* Confirmation Step Actions */
              <>
                <button
                  onClick={() => actions.setShowConfirmation(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !canProceed}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                  ) : selectedAction === 'approve' ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm {selectedAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </>
            ) : (
              /* Form Step Actions */
              <>
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !canProceed}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review & Confirm
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchApprovalModal;