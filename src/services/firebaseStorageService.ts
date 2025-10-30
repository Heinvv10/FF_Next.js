/**
 * Firebase Storage Service
 * Reusable service for file uploads to Firebase Storage
 * Used by: Contractor documents, pole photos, etc.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
}

export class FirebaseStorageService {
  /**
   * Upload a file to Firebase Storage
   * @param file - File to upload
   * @param path - Storage path (e.g., 'contractors/123/documents')
   * @returns Upload result with URL and metadata
   */
  static async uploadFile(file: File, path: string): Promise<UploadResult> {
    try {
      // Sanitize filename
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${sanitizedFileName}`;

      // Create storage reference
      const fullPath = `${path}/${fileName}`;
      const storageRef = ref(storage, fullPath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Get download URL
      const url = await getDownloadURL(snapshot.ref);

      return {
        url,
        path: fullPath,
        fileName: sanitizedFileName,
        size: file.size,
      };
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param path - Full storage path to the file
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sanitize filename to prevent issues
   * Removes special characters, spaces, etc.
   */
  private static sanitizeFileName(fileName: string): string {
    // Get file extension
    const lastDot = fileName.lastIndexOf('.');
    const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    const ext = lastDot > 0 ? fileName.substring(lastDot) : '';

    // Remove special characters, keep only alphanumeric, dash, underscore
    const sanitized = name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100); // Limit length

    return sanitized + ext;
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSize - Maximum file size in bytes
   */
  static validateFile(
    file: File,
    allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: number = 10 * 1024 * 1024 // 10MB default
  ): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get contractor document storage path
   */
  static getContractorDocumentPath(contractorId: string): string {
    return `contractors/${contractorId}/documents`;
  }
}
