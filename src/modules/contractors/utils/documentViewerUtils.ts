/**
 * Document Viewer Utilities - Helper functions for document viewing
 * Extracted from DocumentViewer.tsx to meet constitutional requirements
 * @module documentViewerUtils
 */

import React from 'react';
import { FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';

/**
 * File type definitions
 */
export type FileType = 'pdf' | 'image' | 'unsupported';

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const sizes = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, sizes);
  
  return `${size.toFixed(sizes === 0 ? 0 : 1)} ${units[sizes]}`;
}

/**
 * Get document type icon configuration
 */
export function getDocumentIconConfig(fileType: FileType) {
  switch (fileType) {
    case 'pdf':
      return { icon: FileText, className: "w-6 h-6 text-red-600" };
    case 'image':
      return { icon: ImageIcon, className: "w-6 h-6 text-blue-600" };
    case 'unsupported':
    default:
      return { icon: AlertCircle, className: "w-6 h-6 text-gray-400" };
  }
}

/**
 * Get document type icon JSX element
 */
export function getDocumentIcon(fileType: FileType): React.ReactElement {
  const config = getDocumentIconConfig(fileType);
  const IconComponent = config.icon;
  return React.createElement(IconComponent, { className: config.className });
}

/**
 * Get file type from document
 */
export function getFileType(document: ContractorDocument): FileType {
  const mimeType = document.mimeType?.toLowerCase() || '';
  const fileName = document.fileName.toLowerCase();

  // Check MIME type first
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';

  // Fallback to file extension
  if (fileName.endsWith('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(fileName)) return 'image';

  return 'unsupported';
}

/**
 * Validate zoom level
 */
export function validateZoom(zoom: number, minZoom: number = 0.1, maxZoom: number = 5.0): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Get zoom level display text
 */
export function getZoomDisplayText(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * Validate page number
 */
export function validatePageNumber(page: number, totalPages: number): number {
  return Math.max(1, Math.min(totalPages, Math.round(page)));
}

/**
 * Get page navigation info
 */
export function getPageNavigationInfo(currentPage: number, totalPages: number) {
  return {
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    displayText: `${currentPage} / ${totalPages}`
  };
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return [
    // PDF
    '.pdf',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'
  ];
}

/**
 * Check if file is supported
 */
export function isFileSupported(fileName: string, mimeType?: string): boolean {
  return getFileType({ fileName, mimeType } as ContractorDocument) !== 'unsupported';
}

/**
 * Get file format description
 */
export function getFileFormatDescription(fileType: FileType): string {
  switch (fileType) {
    case 'pdf':
      return 'Portable Document Format';
    case 'image':
      return 'Image File';
    case 'unsupported':
    default:
      return 'Unsupported Format';
  }
}

/**
 * Generate download filename
 */
export function generateDownloadFilename(originalName: string, documentType?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = originalName.split('.').pop() || '';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  if (documentType) {
    return `${nameWithoutExt}_${documentType}_${timestamp}.${extension}`;
  }
  
  return `${nameWithoutExt}_${timestamp}.${extension}`;
}

/**
 * Get document status indicators
 */
export function getDocumentStatusInfo(document: ContractorDocument) {
  const now = new Date();
  const uploaded = new Date(document.createdAt);
  const daysSinceUpload = Math.floor((now.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24));
  
  let status = 'normal';
  let statusText = '';
  
  if (document.expiryDate) {
    const expiry = new Date(document.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      status = 'expired';
      statusText = 'Expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'expiring';
      statusText = `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
    }
  }
  
  return {
    status: status as 'normal' | 'expiring' | 'expired',
    statusText,
    daysSinceUpload,
    uploadDate: uploaded.toLocaleDateString()
  };
}

/**
 * Default viewer configuration
 */
export const DEFAULT_VIEWER_CONFIG = {
  minZoom: 0.1,
  maxZoom: 5.0,
  zoomStep: 0.25,
  defaultZoom: 1.0,
  rotationStep: 90,
  enableKeyboardShortcuts: true,
  showToolbar: true,
  showMetadata: true,
  autoFitToContainer: true,
} as const;