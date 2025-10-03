/**
 * Document Upload Hook
 * Custom hook for document upload operations and state management
 * Updated to use Neon PostgreSQL for file storage (Firebase Storage removed)
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import { DocumentType, ContractorDocument } from '@/types/contractor.types';
import { DOCUMENT_TYPE_LABELS } from '../types/documentUpload.types';
import { validateUploadFile } from '../utils/documentUtils';
import { log } from '@/lib/logger';

export function useDocumentUpload(
  contractorId: string,
  documentType: DocumentType,
  documentTitle: string,
  onUploadComplete?: (document: ContractorDocument) => void,
  onDocumentRemove?: (documentId: string) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to Buffer for Neon storage
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      setUploadProgress(25);

      // Upload document directly to Neon PostgreSQL
      const documentData = {
        documentType,
        documentName: documentTitle || DOCUMENT_TYPE_LABELS[documentType],
        fileName: file.name,
        fileBuffer,
        fileSize: file.size,
        mimeType: file.type,
        issueDate: new Date(),
        notes: `Uploaded for ${DOCUMENT_TYPE_LABELS[documentType]}`
      };

      const documentId = await contractorDocumentService.uploadDocument(contractorId, documentData);
      setUploadProgress(100);

      // Get the created document from contractor service
      const documents = await contractorDocumentService.getByContractor(contractorId);
      const newDocument = documents.find(doc => doc.id === documentId);

      if (newDocument && onUploadComplete) {
        onUploadComplete(newDocument);
      }

      toast.success('Document uploaded successfully');
    } catch (error: any) {
      log.error('Upload error:', { data: error }, 'useDocumentUpload');
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveDocument = async (currentDocument: ContractorDocument) => {
    if (!window.confirm('Are you sure you want to remove this document?')) {
      return;
    }

    try {
      await contractorDocumentService.deleteDocument(currentDocument.id);
      if (onDocumentRemove) {
        onDocumentRemove(currentDocument.id);
      }
      toast.success('Document removed successfully');
    } catch (error: any) {
      log.error('Remove error:', { data: error }, 'useDocumentUpload');
      toast.error(error.message || 'Failed to remove document');
    }
  };

  const handleViewDocument = async (currentDocument: ContractorDocument) => {
    try {
      // Retrieve file from Neon storage and create blob URL for viewing
      const fileData = await contractorDocumentService.retrieveDocument(currentDocument.id);
      const blob = new Blob([fileData.fileData], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      log.error('View error:', { data: error }, 'useDocumentUpload');
      toast.error(error.message || 'Failed to view document');
    }
  };

  const handleDownloadDocument = async (currentDocument: ContractorDocument) => {
    try {
      // Retrieve file from Neon storage for download
      const fileData = await contractorDocumentService.retrieveDocument(currentDocument.id);
      const blob = new Blob([fileData.fileData], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.fileName;
      link.click();

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      log.error('Download error:', { data: error }, 'useDocumentUpload');
      toast.error(error.message || 'Failed to download document');
    }
  };

  return {
    isUploading,
    uploadProgress,
    handleFileSelect,
    handleRemoveDocument,
    handleViewDocument,
    handleDownloadDocument
  };
}