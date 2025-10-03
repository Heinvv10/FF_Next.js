/**
 * Document Queue Utilities
 * Extracted utility functions for document queue filtering and statistics
 */

import { ContractorDocument } from '@/types/contractor.types';
import { DocumentQueueStats } from '../../components/documents/types/documentApproval.types';

/**
 * Filter documents based on search term and filters
 */
export function filterDocuments(
  documents: ContractorDocument[],
  statusFilter: string,
  documentTypeFilter: string,
  expiryFilter: string,
  searchTerm: string
): ContractorDocument[] {
  let filtered = [...documents];

  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = applyStatusFilter(filtered, statusFilter);
  }

  // Apply document type filter
  if (documentTypeFilter !== 'all') {
    filtered = filtered.filter(d => d.documentType === documentTypeFilter);
  }

  // Apply expiry filter
  if (expiryFilter !== 'all') {
    filtered = applyExpiryFilter(filtered, expiryFilter);
  }

  // Apply search term
  if (searchTerm.trim()) {
    filtered = applySearchFilter(filtered, searchTerm);
  }

  return filtered;
}

/**
 * Apply status filter to documents
 */
function applyStatusFilter(documents: ContractorDocument[], statusFilter: string): ContractorDocument[] {
  switch (statusFilter) {
    case 'pending':
      return documents.filter(d => d.verificationStatus === 'pending');
    case 'approved':
      return documents.filter(d => d.verificationStatus === 'verified');
    case 'rejected':
      return documents.filter(d => d.verificationStatus === 'rejected');
    case 'expired':
      return documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date());
    default:
      return documents;
  }
}

/**
 * Apply expiry filter to documents
 */
function applyExpiryFilter(documents: ContractorDocument[], expiryFilter: string): ContractorDocument[] {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

  switch (expiryFilter) {
    case 'expiring':
      return documents.filter(d =>
        d.expiryDate &&
        new Date(d.expiryDate) > now &&
        new Date(d.expiryDate) <= thirtyDaysFromNow
      );
    case 'expired':
      return documents.filter(d => d.expiryDate && new Date(d.expiryDate) < now);
    default:
      return documents;
  }
}

/**
 * Apply search filter to documents
 */
function applySearchFilter(documents: ContractorDocument[], searchTerm: string): ContractorDocument[] {
  const term = searchTerm.toLowerCase();
  return documents.filter(d =>
    d.documentName?.toLowerCase().includes(term) ||
    d.documentType?.toLowerCase().includes(term) ||
    d.documentNumber?.toLowerCase().includes(term) ||
    d.notes?.toLowerCase().includes(term)
  );
}

/**
 * Calculate comprehensive queue statistics
 */
export function calculateQueueStats(documents: ContractorDocument[]): DocumentQueueStats {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    total: documents.length,
    pending: documents.filter(d => d.verificationStatus === 'pending').length,
    approved: documents.filter(d => d.verificationStatus === 'verified').length,
    rejected: documents.filter(d => d.verificationStatus === 'rejected').length,
    expired: documents.filter(d => d.expiryDate && new Date(d.expiryDate) < now).length,
    expiringWithin30Days: documents.filter(d =>
      d.expiryDate &&
      new Date(d.expiryDate) > now &&
      new Date(d.expiryDate) <= thirtyDaysFromNow
    ).length,
    averageProcessingTime: 0, // Would need processing time data from API
    queuedToday: documents.filter(d =>
      d.createdAt && new Date(d.createdAt) >= todayStart
    ).length,
    processedToday: documents.filter(d =>
      d.verifiedAt && new Date(d.verifiedAt) >= todayStart
    ).length
  };
}