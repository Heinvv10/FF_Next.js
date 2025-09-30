/**
 * Contractor Document Service - Document management operations using Neon
 * Migrated from Firebase to Neon PostgreSQL with direct file storage
 */

import { contractorApiService } from './contractorApiService';
import { neonFileStorageService } from './neonFileStorageService';
import { log } from '@/lib/logger';
import {
  ContractorDocument,
  DocumentType
} from '@/types/contractor.types';

export interface DocumentUploadData {
  documentType: DocumentType;
  documentName: string;
  documentNumber?: string;
  fileName: string;
  fileBuffer: Buffer; // Direct file upload to Neon PostgreSQL
  fileSize?: number;
  mimeType?: string;
  issueDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export const contractorDocumentService = {
  /**
   * Get documents for a contractor
   */
  async getByContractor(contractorId: string): Promise<ContractorDocument[]> {
    try {
      const documents = await contractorApiService.getContractorDocuments(contractorId);
      
      // Sort by documentType and creation date
      return documents.sort((a, b) => {
        const typeCompare = a.documentType.localeCompare(b.documentType);
        if (typeCompare !== 0) return typeCompare;
        // If same type, maintain createdAt desc order
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      log.error('Error getting contractor documents:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to fetch contractor documents');
    }
  },


  /**
   * Upload new document directly to Neon PostgreSQL
   */
  async uploadDocument(contractorId: string, data: DocumentUploadData): Promise<string> {
    try {
      // Validate required fields
      if (!data.fileBuffer || !data.mimeType) {
        throw new Error('fileBuffer and mimeType are required for document upload');
      }

      // First create the document record to get the document ID
      const document = await contractorApiService.addDocument(contractorId, {
        documentType: data.documentType as string,
        documentName: data.documentName,
        fileName: data.fileName,
        filePath: 'neon_storage',
        fileUrl: null,
        expiryDate: data.expiryDate,
        notes: data.notes
      });

      // Store the file using Neon file storage
      const storageResult = await neonFileStorageService.storeFile({
        documentId: parseInt(document.id), // Convert string ID to number
        fileData: data.fileBuffer,
        fileName: data.fileName,
        mimeType: data.mimeType,
        compressionType: 'none' // Can add compression later
      });

      // Update the document record with storage info
      await contractorApiService.updateDocumentStorageInfo(document.id, {
        storageType: 'neon',
        storageId: storageResult.id,
        fileUrl: null // No external URL needed for Neon storage
      });

      log.info('Document stored in Neon PostgreSQL', {
        documentId: document.id,
        storageId: storageResult.id,
        originalSize: storageResult.originalSize,
        fileName: data.fileName
      }, 'contractorDocumentService');

      return document.id;

    } catch (error) {
      log.error('Error uploading document to Neon:', {
        contractorId,
        fileName: data.fileName,
        error
      }, 'contractorDocumentService');
      throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Verify document
   */
  async verifyDocument(documentId: string, verifiedBy: string, status: 'verified' | 'rejected', rejectionReason?: string): Promise<void> {
    try {
      const documentStatus = status === 'verified' ? 'approved' : 'rejected';
      await contractorApiService.updateDocumentStatus(
        documentId, 
        documentStatus,
        rejectionReason || `${status} by ${verifiedBy}`
      );
    } catch (error) {
      log.error('Error verifying document:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to verify document');
    }
  },

  /**
   * Retrieve document file from Neon storage
   */
  async retrieveDocument(documentId: string): Promise<{
    fileData: Buffer;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      // Get document metadata to find storage reference
      const documents = await contractorApiService.getContractorDocumentsByStorageId(documentId);

      if (!documents || documents.length === 0) {
        throw new Error('Document not found');
      }

      const document = documents[0];

      if (!document.storageId || document.storageType !== 'neon') {
        throw new Error('Document is not stored in Neon PostgreSQL');
      }

      // Retrieve file from Neon storage
      const fileData = await neonFileStorageService.retrieveFile(document.storageId);

      return {
        fileData: fileData.fileData,
        fileName: document.fileName,
        mimeType: fileData.mimeType,
        fileSize: fileData.originalSize
      };

    } catch (error) {
      log.error('Error retrieving document from Neon:', { documentId, error }, 'contractorDocumentService');
      throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete document from Neon storage
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document metadata
      const documents = await contractorApiService.getContractorDocumentsByStorageId(documentId);

      if (!documents || documents.length === 0) {
        throw new Error('Document not found');
      }

      const document = documents[0];

      // Delete file from Neon storage if it's stored there
      if (document.storageId && document.storageType === 'neon') {
        await neonFileStorageService.deleteFile(document.storageId);
        log.info('File deleted from Neon PostgreSQL', { storageId: document.storageId }, 'contractorDocumentService');
      }

      // Delete document record
      await contractorApiService.deleteDocument(documentId);
      log.info('Document deleted successfully', { documentId }, 'contractorDocumentService');

    } catch (error) {
      log.error('Error deleting document from Neon:', { documentId, error }, 'contractorDocumentService');
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update document details
   */
  async updateDocument(documentId: string, data: Partial<DocumentUploadData>): Promise<void> {
    try {
      // For now, just log as Neon service needs extension for document updates
      log.info('Document update needs implementation in Neon service', 'contractorDocumentService');
    } catch (error) {
      log.error('Error updating document:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to update document');
    }
  },

  /**
   * Get documents expiring soon across all contractors
   */
  async getExpiringDocuments(daysAhead: number = 30): Promise<ContractorDocument[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
      const now = new Date();
      
      // Get all documents and filter client-side
      // In production, this would be a dedicated SQL query
      const allDocuments: ContractorDocument[] = [];
      
      // Note: This is a simplified approach. In production, 
      // we'd need a dedicated endpoint to query all expiring documents
      log.warn('getExpiringDocuments needs a dedicated SQL query implementation', undefined, 'contractorDocumentService');
      
      return allDocuments.filter(doc => 
        doc.expiryDate && 
        doc.expiryDate > now && 
        doc.expiryDate <= cutoffDate
      ).sort((a, b) => 
        new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
      );
    } catch (error) {
      log.error('Error getting expiring documents:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to fetch expiring documents');
    }
  },

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<ContractorDocument | null> {
    try {
      // This would need a dedicated method in contractorApiService
      log.info('getDocumentById needs implementation in Neon service', 'contractorDocumentService');
      return null;
    } catch (error) {
      log.error('Error getting document:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to fetch document');
    }
  }
};