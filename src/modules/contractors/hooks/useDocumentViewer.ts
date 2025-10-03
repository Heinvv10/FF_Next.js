/**
 * useDocumentViewer Hook - Business logic for document viewing
 * Extracted from DocumentViewer.tsx to meet constitutional requirements
 * @module useDocumentViewer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentPreviewData } from '../components/documents/types/documentApproval.types';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface UseDocumentViewerProps {
  document: ContractorDocument;
  defaultFullscreen?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export function useDocumentViewer({
  document,
  defaultFullscreen = false,
  minZoom = 0.5,
  maxZoom = 3.0
}: UseDocumentViewerProps) {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewData, setPreviewData] = useState<DocumentPreviewData | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * Determine file type from document
   */
  const getFileType = useCallback((doc: ContractorDocument): 'pdf' | 'image' | 'unsupported' => {
    const mimeType = doc.mimeType?.toLowerCase() || '';
    const fileName = doc.fileName.toLowerCase();

    // Check MIME type first
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';

    // Fallback to file extension
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(fileName)) return 'image';

    return 'unsupported';
  }, []);

  /**
   * Load document preview data
   */
  const loadPreviewData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fileType = getFileType(document);
      
      if (fileType === 'unsupported') {
        setError('Unsupported file format. Please download the file to view.');
        return;
      }

      // Load document data
      const fileData = await contractorDocumentService.retrieveDocument(document.id);
      
      // Create blob URL for preview
      const blob = new Blob([fileData.fileData], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);

      // Create preview data
      const preview: DocumentPreviewData = {
        documentId: document.id,
        fileUrl: url,
        fileName: document.fileName,
        mimeType: fileData.mimeType,
        fileSize: fileData.fileData.byteLength,
        metadata: {}
      };

      setPreviewData(preview);
      setDocumentUrl(url);

      log.info('Document preview loaded', { 
        documentId: document.id, 
        fileType,
        size: preview.fileSize 
      }, 'DocumentViewer');

    } catch (error) {
      log.error('Failed to load document preview', { error, documentId: document.id }, 'DocumentViewer');
      setError('Failed to load document preview. Please try again.');
      toast.error('Failed to load document preview');
    } finally {
      setIsLoading(false);
    }
  }, [document, getFileType]);

  /**
   * Zoom controls
   */
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, maxZoom));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, minZoom));
  }, [minZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  /**
   * Rotation control
   */
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetRotation = useCallback(() => {
    setRotation(0);
  }, []);

  /**
   * Page navigation
   */
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  /**
   * Fullscreen control
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  /**
   * Download document
   */
  const handleDownload = useCallback(async () => {
    try {
      if (documentUrl) {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = document.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        log.info('Document download initiated', { documentId: document.id }, 'DocumentViewer');
        toast.success('Download started');
      }
    } catch (error) {
      log.error('Download failed', { error, documentId: document.id }, 'DocumentViewer');
      toast.error('Failed to download document');
    }
  }, [documentUrl, document]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
    }
  }, [documentUrl]);

  // Load preview data on mount
  useEffect(() => {
    loadPreviewData();
    return cleanup;
  }, [loadPreviewData, cleanup]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return;

      switch (event.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
        case '=':
        case '+':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetZoom();
          }
          break;
        case 'ArrowLeft':
          handlePreviousPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, exitFullscreen, handleZoomIn, handleZoomOut, resetZoom, handlePreviousPage, handleNextPage]);

  const fileType = getFileType(document);

  return {
    // State
    isLoading,
    error,
    zoom,
    rotation,
    isFullscreen,
    currentPage,
    totalPages,
    previewData,
    documentUrl,
    fileType,
    
    // Refs
    containerRef,
    contentRef,
    
    // Actions
    loadPreviewData,
    handleZoomIn,
    handleZoomOut,
    resetZoom,
    handleRotate,
    resetRotation,
    handleNextPage,
    handlePreviousPage,
    goToPage,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    handleDownload,
    cleanup,
    
    // Setters for advanced use
    setZoom,
    setRotation,
    setCurrentPage,
    setTotalPages,
    setError,
  };
}