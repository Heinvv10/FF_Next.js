/**
 * Document Operations Utilities
 * Extracted document processing operations for useDocumentQueue hook
 */

import { ContractorDocument } from '@/types/contractor.types';
import { BulkApprovalRequest } from '../../components/documents/types/documentApproval.types';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';

/**
 * Approve a single document
 */
export async function approveDocumentOperation(
  documents: ContractorDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<ContractorDocument[]>>,
  processingDocuments: Set<string>,
  setProcessingDocuments: React.Dispatch<React.SetStateAction<Set<string>>>,
  documentId: string,
  notes?: string
): Promise<void> {
  try {
    setProcessingDocuments(prev => new Set([...prev, documentId]));

    // Make actual API call to approve document
    const response = await fetch(`/api/contractors/documents/${documentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes: notes || undefined }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Update local state
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? {
            ...doc,
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString(),
            verificationNotes: notes
          }
        : doc
    ));

    toast.success(result.message || 'Document approved successfully');
    log.info('Document approved successfully', { documentId, result }, 'documentOperations');

  } catch (err) {
    log.error('Failed to approve document:', { data: err, documentId }, 'documentOperations');
    toast.error('Failed to approve document');
    throw err;
  } finally {
    setProcessingDocuments(prev => {
      const updated = new Set(prev);
      updated.delete(documentId);
      return updated;
    });
  }
}

/**
 * Reject a single document
 */
export async function rejectDocumentOperation(
  documents: ContractorDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<ContractorDocument[]>>,
  processingDocuments: Set<string>,
  setProcessingDocuments: React.Dispatch<React.SetStateAction<Set<string>>>,
  documentId: string,
  notes: string
): Promise<void> {
  try {
    setProcessingDocuments(prev => new Set([...prev, documentId]));

    // Make actual API call to reject document
    const response = await fetch(`/api/contractors/documents/${documentId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Update local state
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? {
            ...doc,
            verificationStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: notes
          }
        : doc
    ));

    toast.success(result.message || 'Document rejected');
    log.info('Document rejected successfully', { documentId, notes, result }, 'documentOperations');

  } catch (err) {
    log.error('Failed to reject document:', { data: err, documentId }, 'documentOperations');
    toast.error('Failed to reject document');
    throw err;
  } finally {
    setProcessingDocuments(prev => {
      const updated = new Set(prev);
      updated.delete(documentId);
      return updated;
    });
  }
}

/**
 * Bulk approve multiple documents
 */
export async function bulkApproveDocumentsOperation(
  documents: ContractorDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<ContractorDocument[]>>,
  request: BulkApprovalRequest
): Promise<void> {
  try {
    // Make actual API call to bulk approve documents
    const response = await fetch('/api/contractors/documents/bulk-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentIds: request.documentIds,
        notes: request.notes
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Update local state
    setDocuments(prev => prev.map(doc =>
      request.documentIds.includes(doc.id)
        ? {
            ...doc,
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString(),
            verificationNotes: request.notes
          }
        : doc
    ));

    toast.success(result.message || `${request.documentIds.length} documents approved successfully`);
    log.info('Bulk document approval completed', { request, result }, 'documentOperations');

  } catch (err) {
    log.error('Failed to bulk approve documents:', { data: err, request }, 'documentOperations');
    toast.error('Failed to approve documents');
    throw err;
  }
}

/**
 * Load all pending documents across contractors
 */
export async function loadAllPendingDocuments(): Promise<ContractorDocument[]> {
  try {
    // Make actual API call to get pending documents
    const response = await fetch('/api/contractors/documents/pending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    log.info('Pending documents loaded successfully', { count: result.data?.length || 0 }, 'documentOperations');

    // Return the documents, transforming API response to expected format if needed
    return result.data || [];

  } catch (err) {
    log.error('Failed to load pending documents:', { data: err }, 'documentOperations');
    // Return empty array on error to avoid breaking the UI
    return [];
  }
}