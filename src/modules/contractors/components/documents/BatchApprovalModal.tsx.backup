/**
 * BatchApprovalModal Component - Bulk document approval/rejection interface
 * Handles batch processing of multiple documents with validation and progress tracking
 * @module BatchApprovalModal
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Users,
  Eye,
  RotateCcw
} from 'lucide-react';
import { BulkApprovalRequest, DocumentRejectionReason } from './types/documentApproval.types';
import { contractorService } from '@/services/contractorService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

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
 * Batch processing progress tracking
 */
// Interface for batch progress tracking (unused - planned feature)
/*
interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentDocument?: string;
  errors: { documentId: string; error: string }[];
}
*/

/**
 * Document preview data for batch processing
 */
interface DocumentPreview {
  id: string;
  name: string;
  type: string;
  status: string;
  expiryDate?: Date;
  isExpired: boolean;
  isExpiring: boolean;
  contractor?: string;
  selected: boolean;
}

/**
 * BatchApprovalModal - Comprehensive bulk processing interface
 */
export function BatchApprovalModal({
  documentIds,
  onSubmit,
  onClose,
  isProcessing = false,
  enablePreview = true,
  maxBatchSize = 50
}: BatchApprovalModalProps) {
  // 🟢 WORKING: Component state
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState<DocumentRejectionReason>('other');
  const [notes, setNotes] = useState('');
  const [skipValidation, setSkipValidation] = useState(false);
  const [documentsPreview, setDocumentsPreview] = useState<DocumentPreview[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set(documentIds));
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Rejection reason options
   */
  const REJECTION_REASONS: { value: DocumentRejectionReason; label: string }[] = [
    { value: 'expired', label: 'Expired Document' },
    { value: 'invalid_format', label: 'Invalid Format' },
    { value: 'poor_quality', label: 'Poor Quality' },
    { value: 'incomplete_information', label: 'Incomplete Information' },
    { value: 'incorrect_document_type', label: 'Incorrect Document Type' },
    { value: 'missing_signature', label: 'Missing Signature' },
    { value: 'invalid_issuer', label: 'Invalid Issuer' },
    { value: 'duplicate', label: 'Duplicate Document' },
    { value: 'other', label: 'Other (specify in notes)' }
  ];

  /**
   * Load document previews for batch processing
   */
  const loadDocumentPreviews = useCallback(async () => {
    if (!enablePreview) return;
    
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      
      // Load document details for each ID
      const previews = await Promise.all(
        documentIds.map(async (id) => {
          try {
            const document = await contractorService.documents.getDocumentById(id);
            if (!document) {
              throw new Error(`Document ${id} not found`);
            }
            
            const now = new Date();
            const isExpired = document.expiryDate ? new Date(document.expiryDate) < now : false;
            const isExpiring = document.expiryDate ? 
              !isExpired && (new Date(document.expiryDate).getTime() - now.getTime()) <= (30 * 24 * 60 * 60 * 1000) : false;
            
            return {
              id: document.id,
              name: document.documentName,
              type: document.documentType.replace('_', ' '),
              status: document.verificationStatus,
              expiryDate: document.expiryDate,
              isExpired,
              isExpiring,
              contractor: document.contractorId, // 🟡 PARTIAL: Would fetch contractor name
              selected: true
            } as DocumentPreview;
          } catch (error) {
            log.error(`Failed to load document ${id}:`, { data: error }, 'BatchApprovalModal');
            return {
              id,
              name: `Document ${id}`,
              type: 'unknown',
              status: 'unknown',
              isExpired: false,
              isExpiring: false,
              selected: false
            } as DocumentPreview;
          }
        })
      );
      
      setDocumentsPreview(previews);
      
      // Update selected documents based on successful loads
      const validIds = previews.filter(p => p.selected).map(p => p.id);
      setSelectedDocuments(new Set(validIds));
      
    } catch (error) {
      log.error('Failed to load document previews:', { data: error }, 'BatchApprovalModal');
      setPreviewError('Failed to load document previews. Some documents may not be available.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [documentIds, enablePreview]);

  /**
   * Validate batch operation
   */
  const validateBatchOperation = useCallback((): string[] => {
    const errors: string[] = [];
    
    // Check batch size
    if (selectedDocuments.size === 0) {
      errors.push('No documents selected for processing');
    } else if (selectedDocuments.size > maxBatchSize) {
      errors.push(`Batch size (${selectedDocuments.size}) exceeds maximum allowed (${maxBatchSize})`);
    }
    
    // Check rejection requirements
    if (selectedAction === 'reject') {
      if (rejectionReason === 'other' && !notes.trim()) {
        errors.push('Notes are required when selecting "Other" as rejection reason');
      }
    }
    
    // Check for expired documents in approval batch
    if (selectedAction === 'approve' && enablePreview) {
      const expiredDocs = documentsPreview.filter(doc => 
        selectedDocuments.has(doc.id) && doc.isExpired
      );
      if (expiredDocs.length > 0 && !skipValidation) {
        errors.push(`Cannot approve ${expiredDocs.length} expired document(s) without validation override`);
      }
    }
    
    // Check for documents with different statuses
    if (enablePreview) {
      const nonPendingDocs = documentsPreview.filter(doc => 
        selectedDocuments.has(doc.id) && doc.status !== 'pending'
      );
      if (nonPendingDocs.length > 0 && !skipValidation) {
        errors.push(`${nonPendingDocs.length} document(s) are not in pending status`);
      }
    }
    
    return errors;
  }, [selectedDocuments, selectedAction, rejectionReason, notes, maxBatchSize, documentsPreview, skipValidation, enablePreview]);

  /**
   * Toggle document selection
   */
  const toggleDocumentSelection = useCallback((documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select all documents
   */
  const selectAllDocuments = useCallback(() => {
    const selectableIds = documentsPreview
      .filter(doc => doc.selected)
      .map(doc => doc.id);
    setSelectedDocuments(new Set(selectableIds));
  }, [documentsPreview]);

  /**
   * Clear all selections
   */
  const clearAllSelections = useCallback(() => {
    setSelectedDocuments(new Set());
  }, []);

  /**
   * Handle batch submission
   */
  const handleSubmit = async () => {
    const errors = validateBatchOperation();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }
    
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    const request: BulkApprovalRequest = {
      documentIds: Array.from(selectedDocuments),
      action: selectedAction,
      processedBy: 'current_user', // 🟡 PARTIAL: Would get from auth context
      skipValidation,
      ...(selectedAction === 'reject' && rejectionReason && { reasonCode: rejectionReason }),
      ...(notes.trim() && { notes: notes.trim() })
    };
    
    try {
      await onSubmit(request);
    } catch (error) {
      log.error('Batch operation failed:', { data: error }, 'BatchApprovalModal');
      toast.error('Batch operation failed');
    }
  };

  /**
   * Get batch summary
   */
  const batchSummary = useMemo(() => {
    const total = selectedDocuments.size;
    const approved = selectedAction === 'approve' ? total : 0;
    const rejected = selectedAction === 'reject' ? total : 0;
    
    const expiredCount = documentsPreview.filter(doc => 
      selectedDocuments.has(doc.id) && doc.isExpired
    ).length;
    
    const expiringCount = documentsPreview.filter(doc => 
      selectedDocuments.has(doc.id) && doc.isExpiring
    ).length;
    
    return {
      total,
      approved,
      rejected,
      expiredCount,
      expiringCount
    };
  }, [selectedDocuments, selectedAction, documentsPreview]);

  // Load document previews on mount
  useEffect(() => {
    loadDocumentPreviews();
  }, [loadDocumentPreviews]);

  // Validate on state changes
  useEffect(() => {
    if (showConfirmation) {
      const errors = validateBatchOperation();
      setValidationErrors(errors);
    }
  }, [selectedDocuments, selectedAction, rejectionReason, notes, skipValidation, showConfirmation, validateBatchOperation]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Batch Document Processing
              </h2>
              <p className="text-gray-600">
                Process {documentIds.length} documents at once
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {!showConfirmation ? (
            /* Configuration Phase */
            <div className="p-6 space-y-6">
              {/* Action Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Action</h3>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approve"
                      checked={selectedAction === 'approve'}
                      onChange={(e) => setSelectedAction(e.target.value as 'approve')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Approve Documents</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reject"
                      checked={selectedAction === 'reject'}
                      onChange={(e) => setSelectedAction(e.target.value as 'reject')}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-gray-900">Reject Documents</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value as DocumentRejectionReason)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    {REJECTION_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedAction === 'reject' && rejectionReason === 'other' ? 'Notes *' : 'Notes (Optional)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Add notes for this batch ${selectedAction}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {notes.length}/500 characters
                </div>
              </div>

              {/* Document Preview */}
              {enablePreview && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Documents to Process</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllDocuments}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllSelections}
                        className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="lg" label="Loading documents..." />
                    </div>
                  ) : previewError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Preview Error</span>
                      </div>
                      <p className="text-red-700 text-sm">{previewError}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {documentsPreview.map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex items-center gap-3 p-3 border-b border-gray-200 last:border-b-0 ${
                            !doc.selected ? 'opacity-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocuments.has(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            disabled={!doc.selected}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          
                          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {doc.name}
                              </span>
                              
                              {doc.isExpired && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Expired
                                </span>
                              )}
                              
                              {!doc.isExpired && doc.isExpiring && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Expiring Soon
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {doc.type} • Status: {doc.status}
                              {doc.expiryDate && (
                                <span> • Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Validation Options */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={skipValidation}
                    onChange={(e) => setSkipValidation(e.target.checked)}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-yellow-800">
                      Skip validation checks
                    </span>
                    <p className="text-xs text-yellow-700 mt-1">
                      This will allow processing of expired documents and documents with non-pending status.
                      Use with caution.
                    </p>
                  </div>
                </label>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Validation Errors</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Confirmation Phase */
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  selectedAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {selectedAction === 'approve' ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirm Batch {selectedAction === 'approve' ? 'Approval' : 'Rejection'}
                </h3>
                
                <p className="text-gray-600">
                  You are about to {selectedAction} {batchSummary.total} documents.
                  This action cannot be undone.
                </p>
              </div>

              {/* Batch Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Batch Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Documents</div>
                    <div className="text-lg font-semibold text-gray-900">{batchSummary.total}</div>
                  </div>
                  
                  {selectedAction === 'approve' && (
                    <div>
                      <div className="text-gray-600">To Approve</div>
                      <div className="text-lg font-semibold text-green-600">{batchSummary.approved}</div>
                    </div>
                  )}
                  
                  {selectedAction === 'reject' && (
                    <div>
                      <div className="text-gray-600">To Reject</div>
                      <div className="text-lg font-semibold text-red-600">{batchSummary.rejected}</div>
                    </div>
                  )}
                  
                  {batchSummary.expiredCount > 0 && (
                    <div>
                      <div className="text-gray-600">Expired</div>
                      <div className="text-lg font-semibold text-red-600">{batchSummary.expiredCount}</div>
                    </div>
                  )}
                  
                  {batchSummary.expiringCount > 0 && (
                    <div>
                      <div className="text-gray-600">Expiring Soon</div>
                      <div className="text-lg font-semibold text-yellow-600">{batchSummary.expiringCount}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Details */}
              {(selectedAction === 'reject' || notes.trim()) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {selectedAction === 'reject' && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Rejection Reason:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {REJECTION_REASONS.find(r => r.value === rejectionReason)?.label}
                      </span>
                    </div>
                  )}
                  
                  {notes.trim() && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="mt-1 text-sm text-gray-900">{notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Final Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Cannot Proceed</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedDocuments.size} of {documentIds.length} documents selected
          </div>
          
          <div className="flex items-center gap-3">
            {showConfirmation ? (
              <>
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || validationErrors.length > 0}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                  ) : (
                    selectedAction === 'approve' ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )
                  )}
                  Confirm {selectedAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </>
            ) : (
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
                  disabled={isProcessing || validationErrors.length > 0 || selectedDocuments.size === 0}
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