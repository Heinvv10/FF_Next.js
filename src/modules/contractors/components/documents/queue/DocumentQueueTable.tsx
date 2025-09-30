/**
 * DocumentQueueTable - Table display for document approval queue
 * Handles document listing, selection, and basic actions
 * Extracted from DocumentApprovalQueue.tsx for constitutional compliance
 */

import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Download,
  FileText,
  Calendar,
  Building
} from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { ApprovalActions } from '../ApprovalActions';

interface DocumentQueueTableProps {
  documents: ContractorDocument[];
  selectedDocuments: Set<string>;
  processingDocuments: Set<string>;
  enableBatchOperations?: boolean;
  onSelectDocument: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewDocument: (document: ContractorDocument) => void;
  onApproveDocument: (id: string, notes?: string) => Promise<void>;
  onRejectDocument: (id: string, notes: string) => Promise<void>;
}

export function DocumentQueueTable({
  documents,
  selectedDocuments,
  processingDocuments,
  enableBatchOperations = true,
  onSelectDocument,
  onSelectAll,
  onViewDocument,
  onApproveDocument,
  onRejectDocument
}: DocumentQueueTableProps) {
  const allSelected = documents.length > 0 && documents.every(doc => selectedDocuments.has(doc.id));
  const someSelected = documents.some(doc => selectedDocuments.has(doc.id));

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">No documents found</div>
          <div className="text-gray-600">
            No documents match your current filters. Try adjusting your search criteria.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enableBatchOperations && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            )}
            <span className="font-medium text-gray-900">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
            {selectedDocuments.size > 0 && (
              <span className="text-sm text-blue-600">
                ({selectedDocuments.size} selected)
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Sorted by upload date (newest first)
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y divide-gray-200">
        {documents.map((document) => {
          const isSelected = selectedDocuments.has(document.id);
          const isProcessing = processingDocuments.has(document.id);
          
          return (
            <div
              key={document.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Selection Checkbox */}
                {enableBatchOperations && (
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectDocument(document.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Document Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Document Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Document Name and Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {document.documentName || 'Unnamed Document'}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {document.documentType}
                        </span>
                      </div>

                      {/* Contractor and Upload Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>Contractor ID: {document.contractorId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Uploaded: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {document.expiryDate && (
                          <div>
                            <span className="font-medium">Expires:</span> {new Date(document.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                        {document.documentNumber && (
                          <div>
                            <span className="font-medium">Number:</span> {document.documentNumber}
                          </div>
                        )}
                      </div>
                      
                      {/* Notes */}
                      {document.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {document.notes}
                        </div>
                      )}
                      
                      {/* Rejection Reason */}
                      {document.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Rejection Reason:</span> {document.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Column */}
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <div className="flex items-center">
                    {document.verificationStatus === 'pending' && (
                      <div className="flex items-center px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </div>
                    )}
                    {document.verificationStatus === 'verified' && (
                      <div className="flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approved
                      </div>
                    )}
                    {document.verificationStatus === 'rejected' && (
                      <div className="flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDocument(document)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="View document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => window.open(document.fileUrl, '_blank')}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Approval Actions for Pending Documents */}
                  {document.verificationStatus === 'pending' && (
                    <ApprovalActions
                      document={document}
                      onApprove={(notes) => onApproveDocument(document.id, notes)}
                      onReject={(notes) => onRejectDocument(document.id, notes)}
                      isProcessing={isProcessing}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}