/**
 * Document Upload Card Component
 * Modular document upload with status tracking for contractor onboarding
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { DocumentUploadCardProps, DOCUMENT_TYPE_LABELS } from './types/documentUpload.types';
import { getStatusColor } from './utils/documentUtils';
import { useDocumentUpload } from './hooks/useDocumentUpload';
import { DocumentStatus } from './components/DocumentStatus';
import { DocumentInfo } from './components/DocumentInfo';
import { UploadButton } from './components/UploadButton';

export function DocumentUploadCard({
  contractorId,
  documentType,
  documentTitle,
  description,
  required = false,
  currentDocument,
  onUploadComplete,
  onDocumentRemove
}: DocumentUploadCardProps) {
  const {
    isUploading,
    uploadProgress,
    handleFileSelect,
    handleRemoveDocument,
    handleViewDocument,
    handleDownloadDocument
  } = useDocumentUpload(
    contractorId,
    documentType,
    documentTitle,
    onUploadComplete,
    onDocumentRemove
  );

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${getStatusColor(currentDocument)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {documentTitle || DOCUMENT_TYPE_LABELS[documentType]}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        <DocumentStatus {...(currentDocument && { currentDocument })} />
      </div>

      {currentDocument && (
        <DocumentInfo
          currentDocument={currentDocument}
          onViewDocument={() => handleViewDocument(currentDocument)}
          onDownloadDocument={() => handleDownloadDocument(currentDocument)}
          onRemoveDocument={() => handleRemoveDocument(currentDocument)}
        />
      )}

      <UploadButton
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        {...(currentDocument && { currentDocument })}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}