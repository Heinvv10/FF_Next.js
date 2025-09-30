/**
 * BatchApprovalPreview - Preview and confirmation component for batch operations
 * Displays document summary, statistics, and final confirmation
 * Extracted from BatchApprovalModal.tsx for constitutional compliance
 */

import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';

interface BatchSummary {
  totalDocuments: number;
  selectedCount: number;
  pendingCount: number;
  expiredCount: number;
  expiringCount: number;
  documentTypes: { [key: string]: number };
}

interface BatchApprovalPreviewProps {
  documents: ContractorDocument[];
  selectedDocuments: Set<string>;
  selectedAction: 'approve' | 'reject';
  rejectionReason: string;
  notes: string;
  batchSummary: BatchSummary;
  rejectionReasons: Array<{ value: string; label: string }>;
  onDocumentToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BatchApprovalPreview({
  documents,
  selectedDocuments,
  selectedAction,
  rejectionReason,
  notes,
  batchSummary,
  rejectionReasons,
  onDocumentToggle,
  onSelectAll,
  onDeselectAll
}: BatchApprovalPreviewProps) {
  const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));

  return (
    <div className="space-y-6">
      {/* Batch Summary Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Batch Summary</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <div className="text-gray-600">Selected</div>
            <div className="text-2xl font-semibold text-blue-600">{batchSummary.selectedCount}</div>
          </div>

          <div>
            <div className="text-gray-600">Pending</div>
            <div className="text-2xl font-semibold text-yellow-600">{batchSummary.pendingCount}</div>
          </div>

          {batchSummary.expiredCount > 0 && (
            <div>
              <div className="text-gray-600">Expired</div>
              <div className="text-2xl font-semibold text-red-600">{batchSummary.expiredCount}</div>
            </div>
          )}

          {batchSummary.expiringCount > 0 && (
            <div>
              <div className="text-gray-600">Expiring Soon</div>
              <div className="text-2xl font-semibold text-orange-600">{batchSummary.expiringCount}</div>
            </div>
          )}

          {/* Document Types */}
          {Object.entries(batchSummary.documentTypes).map(([type, count]) => (
            <div key={type}>
              <div className="text-gray-600 capitalize">{type.replace('_', ' ')}</div>
              <div className="text-lg font-semibold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Details */}
      {(selectedAction === 'reject' || notes.trim()) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {selectedAction === 'reject' && rejectionReason && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Rejection Reason:</span>
              <span className="ml-2 text-sm text-gray-900">
                {rejectionReasons.find(r => r.value === rejectionReason)?.label}
              </span>
            </div>
          )}

          {notes.trim() && (
            <div>
              <span className="text-sm font-medium text-gray-700">Notes:</span>
              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                {notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">
            Documents to Process ({selectedDocs.length})
          </h4>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {selectedDocs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>No documents selected</div>
              <div className="text-sm">Select documents from the list to proceed</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {selectedDocs.map((document) => {
                const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();
                const isExpiring = document.expiryDate && 
                  new Date(document.expiryDate) > new Date() && 
                  new Date(document.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <div key={document.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(document.id)}
                        onChange={() => onDocumentToggle(document.id)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />

                      {/* Document Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Document Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              {document.documentName || 'Unnamed Document'}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {document.documentType}
                              </span>
                              {document.documentNumber && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">
                                    {document.documentNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center gap-1">
                            {/* Document Status */}
                            {document.verificationStatus === 'pending' && (
                              <div className="flex items-center text-xs text-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </div>
                            )}
                            {document.verificationStatus === 'verified' && (
                              <div className="flex items-center text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                              </div>
                            )}

                            {/* Expiry Warnings */}
                            {isExpired && (
                              <div className="flex items-center text-xs text-red-600 ml-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Expired
                              </div>
                            )}
                            {isExpiring && !isExpired && (
                              <div className="flex items-center text-xs text-orange-600 ml-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Expiring
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="mt-2 text-xs text-gray-500">
                          <div>Contractor: {document.contractorId}</div>
                          {document.expiryDate && (
                            <div>
                              Expires: {new Date(document.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                          {document.notes && (
                            <div className="mt-1 text-gray-600">
                              Notes: {document.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Warning for problematic documents */}
      {(batchSummary.expiredCount > 0 || (selectedAction === 'approve' && batchSummary.expiredCount > 0)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Attention Required</span>
          </div>
          <div className="text-sm text-yellow-700">
            {batchSummary.expiredCount > 0 && (
              <div>
                • {batchSummary.expiredCount} document(s) have expired and may need special attention
              </div>
            )}
            {selectedAction === 'approve' && batchSummary.expiredCount > 0 && (
              <div>
                • Approving expired documents may not be advisable
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}