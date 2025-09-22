/**
 * Contractor Document Service - Document management operations using Neon
 * Migrated from Firebase to Neon PostgreSQL
 */

import { contractorApiService } from './contractorApiService';
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
  fileUrl: string;
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
   * Upload new document
   */
  async uploadDocument(contractorId: string, data: DocumentUploadData): Promise<string> {
    try {
      const document = await contractorApiService.addDocument(contractorId, {
        documentType: data.documentType as string,
        documentName: data.documentName,
        fileName: data.fileName,
        filePath: data.fileUrl, // Using fileUrl as filePath
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        notes: data.notes
      });
      
      return document.id;
    } catch (error) {
      log.error('Error uploading document:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to upload document');
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
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await contractorApiService.deleteDocument(documentId);
    } catch (error) {
      log.error('Error deleting document:', { data: error }, 'contractorDocumentService');
      throw new Error('Failed to delete document');
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