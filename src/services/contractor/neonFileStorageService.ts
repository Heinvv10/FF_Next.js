/**
 * Neon File Storage Service - Direct file storage in PostgreSQL
 * Replaces Firebase Storage for contractor documents
 */

import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';
import crypto from 'crypto';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const sql = neon(databaseUrl);

export interface FileStorageData {
  documentId: number;
  fileData: Buffer;
  fileName: string;
  mimeType: string;
  compressionType?: 'none' | 'gzip';
}

export interface FileStorageResult {
  id: string;
  documentId: number;
  fileHash: string;
  originalSize: number;
  compressedSize: number;
  compressionType: string;
  mimeType: string;
  createdAt: Date;
}

export class NeonFileStorageService {
  /**
   * Store a file directly in PostgreSQL
   */
  async storeFile(data: FileStorageData): Promise<FileStorageResult> {
    try {
      const startTime = Date.now();

      // Generate SHA-256 hash for file integrity
      const fileHash = crypto.createHash('sha256').update(data.fileData).digest('hex');

      // For now, store without compression (can add compression later)
      let compressedData = data.fileData;
      let compressionType = data.compressionType || 'none';
      const originalSize = data.fileData.length;
      let compressedSize = originalSize;

      // Insert file into database
      const result = await sql`
        INSERT INTO contractor_file_storage (
          document_id,
          file_data,
          file_hash,
          compression_type,
          original_size,
          compressed_size,
          mime_type
        ) VALUES (
          ${data.documentId},
          ${compressedData},
          ${fileHash},
          ${compressionType},
          ${originalSize},
          ${compressedSize},
          ${data.mimeType}
        )
        RETURNING
          id,
          document_id,
          file_hash,
          original_size,
          compressed_size,
          compression_type,
          mime_type,
          created_at
      `;

      const storageRecord = result[0];

      log.info('File stored in Neon PostgreSQL', {
        fileId: storageRecord.id,
        documentId: data.documentId,
        originalSize,
        compressedSize,
        compressionType,
        processingTime: Date.now() - startTime
      }, 'NeonFileStorageService');

      return {
        id: storageRecord.id,
        documentId: storageRecord.document_id,
        fileHash: storageRecord.file_hash,
        originalSize: storageRecord.original_size,
        compressedSize: storageRecord.compressed_size,
        compressionType: storageRecord.compression_type,
        mimeType: storageRecord.mime_type,
        createdAt: new Date(storageRecord.created_at)
      };

    } catch (error) {
      log.error('Failed to store file in Neon:', {
        documentId: data.documentId,
        fileSize: data.fileData.length,
        error
      }, 'NeonFileStorageService');
      throw new Error(`Failed to store file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a file from PostgreSQL
   */
  async retrieveFile(fileId: string): Promise<{
    fileData: Buffer;
    fileHash: string;
    mimeType: string;
    originalSize: number;
  }> {
    try {
      const result = await sql`
        SELECT
          file_data,
          file_hash,
          mime_type,
          original_size
        FROM contractor_file_storage
        WHERE id = ${fileId}
      `;

      if (result.length === 0) {
        throw new Error('File not found');
      }

      const fileRecord = result[0];

      // Verify file integrity
      const calculatedHash = crypto.createHash('sha256').update(fileRecord.file_data).digest('hex');
      if (calculatedHash !== fileRecord.file_hash) {
        log.error('File integrity check failed', {
          fileId,
          storedHash: fileRecord.file_hash,
          calculatedHash
        }, 'NeonFileStorageService');
        throw new Error('File integrity check failed');
      }

      return {
        fileData: Buffer.from(fileRecord.file_data),
        fileHash: fileRecord.file_hash,
        mimeType: fileRecord.mime_type,
        originalSize: fileRecord.original_size
      };

    } catch (error) {
      log.error('Failed to retrieve file from Neon:', { fileId, error }, 'NeonFileStorageService');
      throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from PostgreSQL
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM contractor_file_storage
        WHERE id = ${fileId}
        RETURNING id
      `;

      const deleted = result.length > 0;

      if (deleted) {
        log.info('File deleted from Neon PostgreSQL', { fileId }, 'NeonFileStorageService');
      }

      return deleted;

    } catch (error) {
      log.error('Failed to delete file from Neon:', { fileId, error }, 'NeonFileStorageService');
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata without loading the actual file
   */
  async getFileMetadata(fileId: string): Promise<{
    id: string;
    documentId: number;
    fileHash: string;
    originalSize: number;
    compressedSize: number;
    compressionType: string;
    mimeType: string;
    createdAt: Date;
  } | null> {
    try {
      const result = await sql`
        SELECT
          id,
          document_id,
          file_hash,
          original_size,
          compressed_size,
          compression_type,
          mime_type,
          created_at
        FROM contractor_file_storage
        WHERE id = ${fileId}
      `;

      if (result.length === 0) {
        return null;
      }

      const record = result[0];
      return {
        id: record.id,
        documentId: record.document_id,
        fileHash: record.file_hash,
        originalSize: record.original_size,
        compressedSize: record.compressed_size,
        compressionType: record.compression_type,
        mimeType: record.mime_type,
        createdAt: new Date(record.created_at)
      };

    } catch (error) {
      log.error('Failed to get file metadata:', { fileId, error }, 'NeonFileStorageService');
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    totalCompressedSize: number;
    averageFileSize: number;
    compressionRatio: number;
  }> {
    try {
      const result = await sql`
        SELECT
          COUNT(*) as total_files,
          SUM(original_size) as total_size,
          SUM(compressed_size) as total_compressed_size,
          AVG(original_size) as avg_file_size
        FROM contractor_file_storage
      `;

      const stats = result[0];

      return {
        totalFiles: parseInt(stats.total_files) || 0,
        totalSize: parseInt(stats.total_size) || 0,
        totalCompressedSize: parseInt(stats.total_compressed_size) || 0,
        averageFileSize: parseFloat(stats.avg_file_size) || 0,
        compressionRatio: stats.total_size > 0
          ? parseFloat(stats.total_compressed_size) / parseFloat(stats.total_size)
          : 1.0
      };

    } catch (error) {
      log.error('Failed to get storage stats:', { error }, 'NeonFileStorageService');
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify file integrity for all files
   */
  async verifyAllFiles(): Promise<{
    totalFiles: number;
    validFiles: number;
    corruptFiles: number;
    errors: string[];
  }> {
    try {
      const result = await sql`
        SELECT id, file_hash, file_data
        FROM contractor_file_storage
      `;

      let validFiles = 0;
      let corruptFiles = 0;
      const errors: string[] = [];

      for (const file of result) {
        try {
          const calculatedHash = crypto.createHash('sha256').update(file.file_data).digest('hex');
          if (calculatedHash === file.file_hash) {
            validFiles++;
          } else {
            corruptFiles++;
            errors.push(`File ${file.id} hash mismatch`);
          }
        } catch (error) {
          corruptFiles++;
          errors.push(`File ${file.id} verification error: ${error}`);
        }
      }

      return {
        totalFiles: result.length,
        validFiles,
        corruptFiles,
        errors
      };

    } catch (error) {
      log.error('Failed to verify files:', { error }, 'NeonFileStorageService');
      throw new Error(`Failed to verify files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const neonFileStorageService = new NeonFileStorageService();