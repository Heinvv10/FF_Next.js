/**
 * Document Categories Configuration
 *
 * Defines which documents are required and which have expiry dates
 */

import type { DocumentType, DocumentExpiryConfig } from './documentReport.types';

// Company documents that require expiry dates
export const COMPANY_DOCUMENTS_WITH_EXPIRY: DocumentType[] = [
  'CIDB Certificate',
  'B-BBEE Certificate',
  'Tax Clearance',
];

// Company documents without expiry dates
export const COMPANY_DOCUMENTS_NO_EXPIRY: DocumentType[] = [
  'Company Registration',
  'Bank Confirmation Letter',
  'Proof of Address',
];

// All company document types
export const ALL_COMPANY_DOCUMENTS: DocumentType[] = [
  ...COMPANY_DOCUMENTS_WITH_EXPIRY,
  ...COMPANY_DOCUMENTS_NO_EXPIRY,
];

// Team member document types (only ID document)
export const TEAM_MEMBER_DOCUMENTS: DocumentType[] = ['ID Document'];

// Document expiry configuration
export const DOCUMENT_EXPIRY_CONFIG: Record<DocumentType, DocumentExpiryConfig> = {
  'CIDB Certificate': {
    type: 'CIDB Certificate',
    hasExpiry: true,
    expiryWarningDays: 30,
  },
  'B-BBEE Certificate': {
    type: 'B-BBEE Certificate',
    hasExpiry: true,
    expiryWarningDays: 30,
  },
  'Tax Clearance': {
    type: 'Tax Clearance',
    hasExpiry: true,
    expiryWarningDays: 30,
  },
  'Company Registration': {
    type: 'Company Registration',
    hasExpiry: false,
    expiryWarningDays: 0,
  },
  'Bank Confirmation Letter': {
    type: 'Bank Confirmation Letter',
    hasExpiry: false,
    expiryWarningDays: 0,
  },
  'Proof of Address': {
    type: 'Proof of Address',
    hasExpiry: false,
    expiryWarningDays: 0,
  },
  'ID Document': {
    type: 'ID Document',
    hasExpiry: false,
    expiryWarningDays: 0,
  },
};

// Helper to check if document type has expiry
export function hasExpiryDate(documentType: DocumentType): boolean {
  return DOCUMENT_EXPIRY_CONFIG[documentType]?.hasExpiry || false;
}

// Helper to get expiry warning days
export function getExpiryWarningDays(documentType: DocumentType): number {
  return DOCUMENT_EXPIRY_CONFIG[documentType]?.expiryWarningDays || 0;
}
