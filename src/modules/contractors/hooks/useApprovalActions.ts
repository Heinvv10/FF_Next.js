/**
 * useApprovalActions Hook - Business logic for document approval/rejection
 * Extracted from ApprovalActions.tsx to meet constitutional requirements
 * @module useApprovalActions
 */

import { useState, useRef } from 'react';
import { DocumentRejectionReason } from '../components/documents/types/documentApproval.types';
import { ContractorDocument } from '@/types/contractor.types';
import { log } from '@/lib/logger';

interface UseApprovalActionsProps {
  document: ContractorDocument;
  onApprove: (notes?: string) => Promise<void> | void;
  onReject: (notes?: string, reason?: DocumentRejectionReason) => Promise<void> | void;
  requireApprovalNotes?: boolean;
  requireRejectionNotes?: boolean;
  maxNotesLength?: number;
}

export function useApprovalActions({
  document,
  onApprove,
  onReject,
  requireApprovalNotes = false,
  requireRejectionNotes = true,
  maxNotesLength = 500,
}: UseApprovalActionsProps) {
  // State management
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
      errors.push('Please provide details for "Other" rejection reason');
    }
    
    return errors;
  };

  /**
   * Handle quick approval (no form)
   */
  const handleQuickApprove = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      await onApprove();
      log.info('Document approved via quick action', { 
        documentId: document.id,
        documentType: document.type 
      }, 'ApprovalActions');
    } catch (error) {
      log.error('Quick approval failed', { error }, 'ApprovalActions');
      setValidationErrors(['Failed to approve document. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle approval form submission
   */
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const errors = validateInput(approvalNotes, true);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      await onApprove(approvalNotes);
      setApprovalNotes('');
      setShowApprovalForm(false);
      log.info('Document approved with notes', { 
        documentId: document.id,
        notesLength: approvalNotes.length 
      }, 'ApprovalActions');
    } catch (error) {
      log.error('Approval submission failed', { error }, 'ApprovalActions');
      setValidationErrors(['Failed to approve document. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle rejection form submission
   */
  const handleRejectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const errors = validateInput(rejectionNotes, false, rejectionReason);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      await onReject(rejectionNotes, rejectionReason);
      setRejectionNotes('');
      setRejectionReason('other');
      setShowRejectionForm(false);
      log.info('Document rejected', { 
        documentId: document.id,
        reason: rejectionReason,
        notesLength: rejectionNotes.length 
      }, 'ApprovalActions');
    } catch (error) {
      log.error('Rejection submission failed', { error }, 'ApprovalActions');
      setValidationErrors(['Failed to reject document. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form state
   */
  const resetForms = () => {
    setShowApprovalForm(false);
    setShowRejectionForm(false);
    setApprovalNotes('');
    setRejectionNotes('');
    setRejectionReason('other');
    setValidationErrors([]);
    setIsSubmitting(false);
  };

  /**
   * Show approval form
   */
  const showApprovalFormHandler = () => {
    setShowRejectionForm(false);
    setShowApprovalForm(true);
    setValidationErrors([]);
    // Focus on textarea after render
    setTimeout(() => {
      approvalNotesRef.current?.focus();
    }, 100);
  };

  /**
   * Show rejection form
   */
  const showRejectionFormHandler = () => {
    setShowApprovalForm(false);
    setShowRejectionForm(true);
    setValidationErrors([]);
    // Focus on textarea after render
    setTimeout(() => {
      rejectionNotesRef.current?.focus();
    }, 100);
  };

  return {
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
    validateInput,
    
    // Setters
    setApprovalNotes,
    setRejectionNotes,
    setRejectionReason,
    setValidationErrors,
  };
}