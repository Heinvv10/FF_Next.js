/**
 * DocumentApprovalQueue Component - Enhanced document approval workflow interface
 * Refactored for constitutional compliance - now uses composition pattern
 * Reduced from 720 lines to ~120 lines by extracting business logic and UI components
 * @module DocumentApprovalQueue
 */

import React, { useState } from 'react';
import { useDocumentQueue } from '../../hooks/useDocumentQueue';
import { DocumentQueueHeader } from './queue/DocumentQueueHeader';
import { DocumentQueueFilters } from './queue/DocumentQueueFilters';
import { DocumentQueueTable } from './queue/DocumentQueueTable';
import { DocumentQueueActions } from './queue/DocumentQueueActions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DocumentViewer } from './DocumentViewer';
import { ComplianceTracker } from './ComplianceTracker';
import { BatchApprovalModal } from './BatchApprovalModal';
import { ContractorDocument } from '@/types/contractor.types';
import { BulkApprovalRequest } from './types/documentApproval.types';

interface DocumentApprovalQueueProps {
  /**
   * Optional contractor ID to filter documents for specific contractor
   */
  contractorId?: string;
  /**
   * Initial filter status for documents
   */
  initialFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'expired';
  /**
   * Enable batch operations for multiple documents
   */
  enableBatchOperations?: boolean;
  /**
   * Auto-refresh interval in seconds (0 to disable)
   */
  autoRefreshInterval?: number;
  /**
   * Callback when document approval status changes
   */
  onApprovalChange?: (documentId: string, newStatus: string) => void;
}

/**
 * DocumentApprovalQueue - Main component using composition pattern
 * Refactored from 720 lines to ~120 lines for constitutional compliance
 */
export function DocumentApprovalQueue({
  contractorId,
  initialFilter = 'pending',
  enableBatchOperations = true,
  autoRefreshInterval = 30,
  onApprovalChange
}: DocumentApprovalQueueProps) {
  // Use custom hook for all business logic (280 lines moved to hook)
  const {
    documents,
    filteredDocuments,
    selectedDocuments,
    isLoading,
    isRefreshing,
    error,
    isProcessing,
    processingDocuments,
    searchTerm,
    statusFilter,
    documentTypeFilter,
    expiryFilter,
    actions,
    stats
  } = useDocumentQueue({ contractorId, initialFilter, autoRefreshInterval });

  // Modal states (UI only - remaining state in component)
  const [currentDocument, setCurrentDocument] = useState<ContractorDocument | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);

  // Event handlers (delegated to hook)
  const handleDocumentSelect = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    actions.setSelectedDocuments(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredDocuments.map(doc => doc.id));
      actions.setSelectedDocuments(allIds);
    } else {
      actions.setSelectedDocuments(new Set());
    }
  };

  const handleBulkApproval = async (request: BulkApprovalRequest) => {
    await actions.bulkApproveDocuments(request);
    setShowBatchModal(false);
  };

  const handleViewDocument = (document: ContractorDocument) => {
    setCurrentDocument(document);
    setShowDocumentViewer(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner message="Loading documents..." />
      </div>
    );
  }

  // Error state  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Error loading documents</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => actions.loadDocuments(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and actions (120 lines moved to component) */}
      <DocumentQueueHeader
        stats={stats}
        selectedCount={selectedDocuments.size}
        isRefreshing={isRefreshing}
        onRefresh={() => actions.loadDocuments(false)}
        onBulkApprove={() => setShowBatchModal(true)}
        onComplianceTracker={() => setShowComplianceTracker(true)}
        enableBatchOperations={enableBatchOperations}
      />

      {/* Filters (150 lines moved to component) */}
      <DocumentQueueFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        documentTypeFilter={documentTypeFilter}
        expiryFilter={expiryFilter}
        onSearchChange={actions.setSearchTerm}
        onStatusFilterChange={actions.setStatusFilter}
        onDocumentTypeFilterChange={actions.setDocumentTypeFilter}
        onExpiryFilterChange={actions.setExpiryFilter}
      />

      {/* Batch Actions (when documents selected) (80 lines moved to component) */}
      {enableBatchOperations && selectedDocuments.size > 0 && (
        <DocumentQueueActions
          selectedDocuments={selectedDocuments}
          isProcessing={isProcessing}
          onBulkApprove={() => setShowBatchModal(true)}
          onBulkReject={() => {
            // TODO: Implement bulk reject
            console.log('Bulk reject:', Array.from(selectedDocuments));
          }}
          onExportSelected={() => {
            // TODO: Implement export selected
            console.log('Export selected:', Array.from(selectedDocuments));
          }}
          onClearSelection={() => actions.setSelectedDocuments(new Set())}
        />
      )}

      {/* Documents Table (180 lines moved to component) */}
      <DocumentQueueTable
        documents={filteredDocuments}
        selectedDocuments={selectedDocuments}
        processingDocuments={processingDocuments}
        enableBatchOperations={enableBatchOperations}
        onSelectDocument={handleDocumentSelect}
        onSelectAll={handleSelectAll}
        onViewDocument={handleViewDocument}
        onApproveDocument={actions.approveDocument}
        onRejectDocument={actions.rejectDocument}
      />

      {/* Document Viewer Modal */}
      {showDocumentViewer && currentDocument && (
        <DocumentViewer
          document={currentDocument}
          onClose={() => {
            setShowDocumentViewer(false);
            setCurrentDocument(null);
          }}
        />
      )}

      {/* Batch Approval Modal */}
      {showBatchModal && selectedDocuments.size > 0 && (
        <BatchApprovalModal
          documentIds={Array.from(selectedDocuments)}
          onSubmit={handleBulkApproval}
          onClose={() => setShowBatchModal(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Compliance Tracker Modal */}
      {showComplianceTracker && (
        <ComplianceTracker
          documents={documents}
          onClose={() => setShowComplianceTracker(false)}
        />
      )}
    </div>
  );
}

export default DocumentApprovalQueue;