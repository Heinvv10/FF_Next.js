/**
 * useBatchApproval - Business logic hook for batch approval operations
 * Extracted from BatchApprovalModal.tsx to comply with project constitution
 * Handles batch processing logic, validation, and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BulkApprovalRequest, DocumentRejectionReason } from '../components/documents/types/documentApproval.types';
import { ContractorDocument } from '@/types/contractor.types';
import { contractorService } from '@/services/contractorService';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';

interface UseBatchApprovalProps {
  documentIds: string[];
  maxBatchSize?: number;
  enablePreview?: boolean;
}

interface BatchSummary {
  totalDocuments: number;
  selectedCount: number;
  pendingCount: number;
  expiredCount: number;
  expiringCount: number;
  documentTypes: { [key: string]: number };
}

interface UseBatchApprovalReturn {
  // State
  documents: ContractorDocument[];
  selectedDocuments: Set<string>;
  selectedAction: 'approve' | 'reject';
  rejectionReason: string;
  notes: string;
  showConfirmation: boolean;
  isLoading: boolean;
  validationErrors: string[];
  
  // Computed values
  batchSummary: BatchSummary;
  canProceed: boolean;
  
  // Actions
  actions: {
    setSelectedDocuments: (docs: Set<string>) => void;
    setSelectedAction: (action: 'approve' | 'reject') => void;
    setRejectionReason: (reason: string) => void;
    setNotes: (notes: string) => void;
    setShowConfirmation: (show: boolean) => void;
    selectAllDocuments: () => void;
    deselectAllDocuments: () => void;
    toggleDocumentSelection: (id: string) => void;
    validateBatch: () => string[];
    createBulkRequest: () => BulkApprovalRequest;
  };
}

// Predefined rejection reasons
export const REJECTION_REASONS: DocumentRejectionReason[] = [
  { value: 'expired', label: 'Document has expired' },
  { value: 'invalid_format', label: 'Invalid document format' },
  { value: 'illegible', label: 'Document is illegible or unclear' },
  { value: 'incorrect_type', label: 'Incorrect document type submitted' },
  { value: 'missing_information', label: 'Missing required information' },
  { value: 'poor_quality', label: 'Poor image/scan quality' },
  { value: 'fraudulent', label: 'Suspected fraudulent document' },
  { value: 'other', label: 'Other (specify in notes)' }
];

export function useBatchApproval({
  documentIds,
  maxBatchSize = 50,
  enablePreview = true
}: UseBatchApprovalProps): UseBatchApprovalReturn {
  // State management
  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set(documentIds));
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load document details for batch processing
   */
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual document loading
      // const docs = await contractorService.getDocumentsByIds(documentIds);
      
      // Mock data for now - in real implementation, this would load actual documents
      const mockDocuments: ContractorDocument[] = documentIds.map((id, index) => ({
        id,
        contractorId: `contractor-${index + 1}`,
        documentName: `Document ${index + 1}`,
        documentType: ['insurance', 'license', 'registration', 'tax'][index % 4],
        verificationStatus: 'pending',
        fileUrl: `#document-${id}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: index % 5 === 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() : 
                   index % 7 === 0 ? new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() :
                   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        documentNumber: `DOC-${1000 + index}`,
        notes: index % 3 === 0 ? `Sample notes for document ${index + 1}` : undefined
      }));
      
      setDocuments(mockDocuments);
      
    } catch (error) {
      log.error('Failed to load batch documents:', { data: error, documentIds }, 'useBatchApproval');
      toast.error('Failed to load documents for batch processing');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [documentIds]);

  /**
   * Calculate batch summary statistics
   */
  const batchSummary = useMemo((): BatchSummary => {
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const documentTypes: { [key: string]: number } = {};
    selectedDocs.forEach(doc => {
      documentTypes[doc.documentType] = (documentTypes[doc.documentType] || 0) + 1;
    });
    
    return {
      totalDocuments: documents.length,
      selectedCount: selectedDocs.length,
      pendingCount: selectedDocs.filter(doc => doc.verificationStatus === 'pending').length,
      expiredCount: selectedDocs.filter(doc => 
        doc.expiryDate && new Date(doc.expiryDate) < now
      ).length,
      expiringCount: selectedDocs.filter(doc =>
        doc.expiryDate && 
        new Date(doc.expiryDate) > now && 
        new Date(doc.expiryDate) <= thirtyDaysFromNow
      ).length,
      documentTypes
    };
  }, [documents, selectedDocuments]);

  /**
   * Validate batch operation before submission
   */
  const validateBatch = useCallback((): string[] => {
    const errors: string[] = [];
    
    // Check if any documents are selected
    if (selectedDocuments.size === 0) {
      errors.push('No documents selected for batch processing');
    }
    
    // Check batch size limit
    if (selectedDocuments.size > maxBatchSize) {
      errors.push(`Batch size (${selectedDocuments.size}) exceeds maximum allowed (${maxBatchSize})`);
    }
    
    // Check for rejection reason when rejecting
    if (selectedAction === 'reject' && !rejectionReason) {
      errors.push('Rejection reason is required when rejecting documents');
    }
    
    // Check for notes when "other" rejection reason is selected
    if (selectedAction === 'reject' && rejectionReason === 'other' && !notes.trim()) {
      errors.push('Notes are required when selecting "Other" as rejection reason');
    }
    
    // Check for already processed documents
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    const alreadyProcessed = selectedDocs.filter(doc => 
      doc.verificationStatus === 'verified' || doc.verificationStatus === 'rejected'
    );
    
    if (alreadyProcessed.length > 0) {
      errors.push(`${alreadyProcessed.length} document(s) have already been processed`);
    }
    
    // Warning for expired documents if approving
    if (selectedAction === 'approve' && batchSummary.expiredCount > 0) {
      errors.push(`${batchSummary.expiredCount} document(s) have expired and should not be approved`);
    }
    
    return errors;
  }, [selectedDocuments, selectedAction, rejectionReason, notes, documents, maxBatchSize, batchSummary.expiredCount]);

  /**
   * Get current validation errors
   */
  const validationErrors = useMemo(() => validateBatch(), [validateBatch]);

  /**
   * Check if batch operation can proceed
   */
  const canProceed = useMemo(() => 
    validationErrors.length === 0 && selectedDocuments.size > 0, 
    [validationErrors, selectedDocuments.size]
  );

  /**
   * Create bulk approval request object
   */
  const createBulkRequest = useCallback((): BulkApprovalRequest => {
    return {
      documentIds: Array.from(selectedDocuments),
      action: selectedAction,
      rejectionReason: selectedAction === 'reject' ? rejectionReason : undefined,
      notes: notes.trim() || undefined,
      processedAt: new Date().toISOString()
    };
  }, [selectedDocuments, selectedAction, rejectionReason, notes]);

  /**
   * Toggle document selection
   */
  const toggleDocumentSelection = useCallback((documentId: string) => {
    setSelectedDocuments(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(documentId)) {
        newSelection.delete(documentId);
      } else {
        newSelection.add(documentId);
      }
      return newSelection;
    });
  }, []);

  /**
   * Select all documents
   */
  const selectAllDocuments = useCallback(() => {
    const allIds = new Set(documents.map(doc => doc.id));
    setSelectedDocuments(allIds);
  }, [documents]);

  /**
   * Deselect all documents
   */
  const deselectAllDocuments = useCallback(() => {
    setSelectedDocuments(new Set());
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Reset rejection reason when switching to approve
  useEffect(() => {
    if (selectedAction === 'approve') {
      setRejectionReason('');
    }
  }, [selectedAction]);

  return {
    // State
    documents,
    selectedDocuments,
    selectedAction,
    rejectionReason,
    notes,
    showConfirmation,
    isLoading,
    validationErrors,
    
    // Computed values
    batchSummary,
    canProceed,
    
    // Actions
    actions: {
      setSelectedDocuments,
      setSelectedAction,
      setRejectionReason,
      setNotes,
      setShowConfirmation,
      selectAllDocuments,
      deselectAllDocuments,
      toggleDocumentSelection,
      validateBatch,
      createBulkRequest
    }
  };
}