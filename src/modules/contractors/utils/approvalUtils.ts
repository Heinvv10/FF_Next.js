/**
 * Approval Utilities - Constants and helper functions for document approval
 * Extracted from ApprovalActions.tsx to meet constitutional requirements
 * @module approvalUtils
 */

import { DocumentRejectionReason } from '../components/documents/types/documentApproval.types';

/**
 * Available rejection reasons with descriptions
 */
export const REJECTION_REASONS: { 
  value: DocumentRejectionReason; 
  label: string; 
  description: string;
}[] = [
  {
    value: 'poor_quality',
    label: 'Poor Quality',
    description: 'Document quality is not acceptable (blurry, illegible, etc.)'
  },
  {
    value: 'expired',
    label: 'Expired',
    description: 'Document has expired and is no longer valid'
  },
  {
    value: 'incorrect_document_type',
    label: 'Incorrect Document',
    description: 'This is not the correct document type or version'
  },
  {
    value: 'incomplete_information',
    label: 'Incomplete',
    description: 'Document is missing required information or signatures'
  },
  {
    value: 'invalid_format',
    label: 'Invalid Format',
    description: 'Document format is not acceptable'
  },
  {
    value: 'duplicate',
    label: 'Duplicate Document',
    description: 'This document has already been submitted'
  },
  {
    value: 'missing_signature',
    label: 'Missing Signature',
    description: 'Document requires signatures that are not present'
  },
  {
    value: 'invalid_issuer',
    label: 'Invalid Issuer',
    description: 'Document issuer is not recognized or authorized'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please specify in notes)'
  }
];

/**
 * Get rejection reason details by value
 */
export function getRejectionReason(value: DocumentRejectionReason) {
  return REJECTION_REASONS.find(reason => reason.value === value);
}

/**
 * Validate notes length and content
 */
export function validateNotes(
  notes: string, 
  maxLength: number = 500,
  required: boolean = false
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (required && !notes.trim()) {
    errors.push('Notes are required');
  }
  
  if (notes.length > maxLength) {
    errors.push(`Notes cannot exceed ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format notes for display (truncate if needed)
 */
export function formatNotesPreview(notes: string, maxLength: number = 100): string {
  if (!notes) return '';
  if (notes.length <= maxLength) return notes;
  return notes.substring(0, maxLength) + '...';
}

/**
 * Get character count display
 */
export function getCharacterCountDisplay(
  current: number, 
  max: number
): { text: string; isNearLimit: boolean; isOverLimit: boolean } {
  const remaining = max - current;
  const isNearLimit = remaining <= 50;
  const isOverLimit = remaining < 0;
  
  return {
    text: `${current}/${max}`,
    isNearLimit: isNearLimit && !isOverLimit,
    isOverLimit
  };
}

/**
 * Get approval action status
 */
export function getApprovalStatus(
  isProcessing: boolean,
  isSubmitting: boolean
): { 
  canApprove: boolean; 
  canReject: boolean; 
  statusText: string;
} {
  const isDisabled = isProcessing || isSubmitting;
  
  return {
    canApprove: !isDisabled,
    canReject: !isDisabled,
    statusText: isProcessing ? 'Processing...' : isSubmitting ? 'Submitting...' : ''
  };
}

/**
 * Default validation rules
 */
export const DEFAULT_VALIDATION_RULES = {
  maxNotesLength: 500,
  requireApprovalNotes: false,
  requireRejectionNotes: true,
  minNotesLengthForOther: 10,
} as const;