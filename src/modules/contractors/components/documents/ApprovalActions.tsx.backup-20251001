/**
 * ApprovalActions Component - Document approval/rejection actions with validation
 * Provides inline approval controls with comprehensive reason tracking
 * @module ApprovalActions
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  X, 
  AlertCircle,
  ChevronDown,
  Clock,
  FileX
} from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentRejectionReason } from './types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { log } from '@/lib/logger';

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
 * Predefined rejection reasons with user-friendly labels
 */
const REJECTION_REASONS: { value: DocumentRejectionReason; label: string; description: string }[] = [
  {
    value: 'expired',
    label: 'Expired Document',
    description: 'Document has passed its expiry date'
  },
  {
    value: 'invalid_format',
    label: 'Invalid Format',
    description: 'Document format is not acceptable'
  },
  {
    value: 'poor_quality',
    label: 'Poor Quality',
    description: 'Document quality is too low to read clearly'
  },
  {
    value: 'incomplete_information',
    label: 'Incomplete Information',
    description: 'Document is missing required information'
  },
  {
    value: 'incorrect_document_type',
    label: 'Incorrect Type',
    description: 'This is not the expected document type'
  },
  {
    value: 'missing_signature',
    label: 'Missing Signature',
    description: 'Document requires a signature that is missing'
  },
  {
    value: 'invalid_issuer',
    label: 'Invalid Issuer',
    description: 'Document is not from an authorized issuer'
  },
  {
    value: 'duplicate',
    label: 'Duplicate Document',
    description: 'This document has already been submitted'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please specify in notes)'
  }
];

/**
 * ApprovalActions - Interactive approval/rejection controls
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
  // 🟢 WORKING: Component state
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState<DocumentRejectionReason>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Refs for form elements
  const approvalFormRef = useRef<HTMLDivElement>(null);
  const rejectionFormRef = useRef<HTMLDivElement>(null);
  const approvalNotesRef = useRef<HTMLTextAreaElement>(null);
  const rejectionNotesRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Validate form input
   */
  const validateInput = (
    notes: string, 
    isApproval: boolean, 
    reason?: DocumentRejectionReason
  ): string[] => {
    const errors: string[] = [];
    
    // Check notes requirements
    if (isApproval && requireApprovalNotes && !notes.trim()) {
      errors.push('Approval notes are required');
    }
    
    if (!isApproval && requireRejectionNotes && !notes.trim()) {
      errors.push('Rejection notes are required');
    }
    
    // Check notes length
    if (notes.length > maxNotesLength) {
      errors.push(`Notes cannot exceed ${maxNotesLength} characters`);
    }
    
    // Check rejection reason
    if (!isApproval && reason === 'other' && !notes.trim()) {
      errors.push('Please specify reason in notes when selecting "Other"');
    }
    
    return errors;
  };

  /**
   * Handle quick approval (no form)
   */
  const handleQuickApprove = async () => {
    if (isProcessing || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onApprove();
    } catch (error) {
      log.error('Quick approval failed:', { data: error }, 'ApprovalActions');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle approval form submission
   */
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || isSubmitting) return;
    
    const errors = validateInput(approvalNotes, true);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      approvalNotesRef.current?.focus();
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onApprove(approvalNotes.trim() || undefined);
      
      // Reset form
      setApprovalNotes('');
      setShowApprovalForm(false);
      setValidationErrors([]);
    } catch (error) {
      log.error('Approval failed:', { data: error }, 'ApprovalActions');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle rejection form submission
   */
  const handleRejectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || isSubmitting) return;
    
    const errors = validateInput(rejectionNotes, false, rejectionReason);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      rejectionNotesRef.current?.focus();
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onReject(rejectionNotes.trim() || undefined, rejectionReason);
      
      // Reset form
      setRejectionNotes('');
      setRejectionReason('other');
      setShowRejectionForm(false);
      setValidationErrors([]);
    } catch (error) {
      log.error('Rejection failed:', { data: error }, 'ApprovalActions');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cancel form and reset state
   */
  const handleCancel = () => {
    setShowApprovalForm(false);
    setShowRejectionForm(false);
    setApprovalNotes('');
    setRejectionNotes('');
    setRejectionReason('other');
    setValidationErrors([]);
  };

  /**
   * Get expiry status for priority handling
   */
  const getExpiryPriority = (): 'expired' | 'urgent' | 'warning' | 'normal' => {
    if (!document.expiryDate) return 'normal';
    
    const now = new Date();
    const expiryDate = new Date(document.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'urgent';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'normal';
  };

  /**
   * Get priority indicator
   */
  const renderPriorityIndicator = (): JSX.Element | null => {
    const priority = getExpiryPriority();
    
    switch (priority) {
      case 'expired':
        return (
          <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
            <FileX className="w-3 h-3" />
            <span>EXPIRED</span>
          </div>
        );
      case 'urgent':
        return (
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
            <AlertCircle className="w-3 h-3" />
            <span>URGENT</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-1 text-xs text-yellow-600 mb-2">
            <Clock className="w-3 h-3" />
            <span>EXPIRING SOON</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Close forms when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        approvalFormRef.current &&
        !approvalFormRef.current.contains(event.target as Node) &&
        rejectionFormRef.current &&
        !rejectionFormRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    if (showApprovalForm || showRejectionForm) {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
    
    // Return cleanup function even when condition is false (no cleanup needed)
    return () => {};
  }, [showApprovalForm, showRejectionForm]);

  // Focus textarea when forms open
  useEffect(() => {
    if (showApprovalForm && approvalNotesRef.current) {
      approvalNotesRef.current.focus();
    }
  }, [showApprovalForm]);

  useEffect(() => {
    if (showRejectionForm && rejectionNotesRef.current) {
      rejectionNotesRef.current.focus();
    }
  }, [showRejectionForm]);

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
      {!compact && renderPriorityIndicator()}
      
      {!showApprovalForm && !showRejectionForm && (
        <div className="flex items-center gap-2">
          {/* Quick Approve Button */}
          {allowQuickApprove && !requireApprovalNotes && (
            <button
              onClick={handleQuickApprove}
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
              onClick={() => setShowApprovalForm(true)}
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
            onClick={() => setShowRejectionForm(true)}
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Reject document"
          >
            <X className="w-4 h-4" />
            <span className="ml-1">Reject</span>
            {!compact && <ChevronDown className="w-3 h-3 ml-1" />}
          </button>
        </div>
      )}

      {/* Approval Form */}
      {showApprovalForm && (
        <div
          ref={approvalFormRef}
          className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-80"
        >
          <form onSubmit={handleApprovalSubmit}>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-900">Approve Document</h4>
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
              <label htmlFor="approval-notes" className="block text-sm font-medium text-gray-700 mb-1">
                {requireApprovalNotes ? 'Approval Notes *' : 'Approval Notes (Optional)'}
              </label>
              <textarea
                ref={approvalNotesRef}
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={3}
                maxLength={maxNotesLength}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {approvalNotes.length}/{maxNotesLength} characters
                </span>
                {requireApprovalNotes && (
                  <span className="text-xs text-red-500">* Required</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="text-white mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Approve Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rejection Form */}
      {showRejectionForm && (
        <div
          ref={rejectionFormRef}
          className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-96"
        >
          <form onSubmit={handleRejectionSubmit}>
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
                onChange={(e) => setRejectionReason(e.target.value as DocumentRejectionReason)}
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
                {REJECTION_REASONS.find(r => r.value === rejectionReason)?.description}
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="rejection-notes" className="block text-sm font-medium text-gray-700 mb-1">
                {requireRejectionNotes ? 'Additional Notes *' : 'Additional Notes (Optional)'}
              </label>
              <textarea
                ref={rejectionNotesRef}
                id="rejection-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder={`Please provide ${rejectionReason === 'other' ? 'specific details about the rejection' : 'additional context for this rejection'}...`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                maxLength={maxNotesLength}
                required={requireRejectionNotes || rejectionReason === 'other'}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {rejectionNotes.length}/{maxNotesLength} characters
                </span>
                {(requireRejectionNotes || rejectionReason === 'other') && (
                  <span className="text-xs text-red-500">* Required</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
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
                  <X className="w-4 h-4 mr-2" />
                )}
                Reject Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}