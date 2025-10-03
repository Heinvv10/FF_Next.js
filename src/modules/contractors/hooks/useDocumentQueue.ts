/**
 * useDocumentQueue - Business logic hook for document approval queue
 * Extracted from DocumentApprovalQueue.tsx to comply with project constitution
 * Handles data fetching, filtering, and document operations
 * Refactored for constitutional compliance using utility functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentQueueStats, DocumentSortOptions, BulkApprovalRequest } from '../components/documents/types/documentApproval.types';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';
import { filterDocuments, calculateQueueStats } from './utils/documentQueueUtils';
import {
  approveDocumentOperation,
  rejectDocumentOperation,
  bulkApproveDocumentsOperation,
  loadAllPendingDocuments
} from './utils/documentOperations';

interface UseDocumentQueueProps {
  contractorId?: string;
  initialFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'expired';
  autoRefreshInterval?: number;
}

interface UseDocumentQueueReturn {
  // State
  documents: ContractorDocument[];
  filteredDocuments: ContractorDocument[];
  selectedDocuments: Set<string>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isProcessing: boolean;
  processingDocuments: Set<string>;
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  documentTypeFilter: string;
  expiryFilter: string;
  
  // Actions
  actions: {
    loadDocuments: (showLoader?: boolean) => Promise<void>;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (status: string) => void;
    setDocumentTypeFilter: (type: string) => void;
    setExpiryFilter: (filter: string) => void;
    setSelectedDocuments: (docs: Set<string>) => void;
    approveDocument: (id: string, notes?: string) => Promise<void>;
    rejectDocument: (id: string, notes: string) => Promise<void>;
    bulkApproveDocuments: (request: BulkApprovalRequest) => Promise<void>;
  };
  
  // Computed values
  stats: DocumentQueueStats;
}

export function useDocumentQueue({
  contractorId,
  initialFilter = 'pending',
  autoRefreshInterval = 30
}: UseDocumentQueueProps): UseDocumentQueueReturn {
  // State management
  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());

  /**
   * Load documents from service
   */
  const loadDocuments = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      let docs: ContractorDocument[];

      if (contractorId) {
        // Load documents for specific contractor
        // TODO: Implement API call for contractor documents
        docs = []; // Placeholder - no documents service available yet
      } else {
        // Load all pending documents across contractors
        docs = await loadAllPendingDocuments();
      }

      setDocuments(docs);

    } catch (err) {
      log.error('Failed to load documents:', { data: err }, 'useDocumentQueue');
      setError('Failed to load documents. Please try again.');
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [contractorId]);

  /**
   * Approve a document
   */
  const approveDocument = useCallback(async (id: string, notes?: string) => {
    await approveDocumentOperation(
      documents,
      setDocuments,
      processingDocuments,
      setProcessingDocuments,
      id,
      notes
    );
  }, [documents, processingDocuments]);

  /**
   * Reject a document
   */
  const rejectDocument = useCallback(async (id: string, notes: string) => {
    await rejectDocumentOperation(
      documents,
      setDocuments,
      processingDocuments,
      setProcessingDocuments,
      id,
      notes
    );
  }, [documents, processingDocuments]);

  /**
   * Bulk approve documents
   */
  const bulkApproveDocuments = useCallback(async (request: BulkApprovalRequest) => {
    try {
      setIsProcessing(true);

      await bulkApproveDocumentsOperation(documents, setDocuments, request);

      setSelectedDocuments(new Set());
    } catch (err) {
      // Error handling is done in the utility function
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [documents]);

  // Filtered documents using utility function
  const filteredDocuments = useMemo(() => {
    return filterDocuments(documents, statusFilter, documentTypeFilter, expiryFilter, searchTerm);
  }, [documents, statusFilter, documentTypeFilter, expiryFilter, searchTerm]);

  // Calculate queue statistics using utility function
  const stats = useMemo((): DocumentQueueStats => {
    return calculateQueueStats(documents);
  }, [documents]);

  // Auto-refresh setup
  useEffect(() => {
    loadDocuments(true);
    
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        loadDocuments(false);
      }, autoRefreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [loadDocuments, autoRefreshInterval]);

  return {
    // State
    documents,
    filteredDocuments,
    selectedDocuments,
    isLoading,
    isRefreshing,
    error,
    isProcessing,
    processingDocuments,
    
    // Filters
    searchTerm,
    statusFilter,
    documentTypeFilter,
    expiryFilter,
    
    // Actions
    actions: {
      loadDocuments,
      setSearchTerm,
      setStatusFilter,
      setDocumentTypeFilter,
      setExpiryFilter,
      setSelectedDocuments,
      approveDocument,
      rejectDocument,
      bulkApproveDocuments
    },
    
    // Computed values
    stats
  };
}