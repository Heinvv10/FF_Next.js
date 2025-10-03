/**
 * DocumentViewer Component - In-browser PDF/image preview with enhanced functionality
 * Supports multiple file types with optimized viewing experience
 * @module DocumentViewer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentPreviewData } from './types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { contractorDocumentService } from '@/services/contractor/contractorDocumentService';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface DocumentViewerProps {
  /**
   * Document to view
   */
  document: ContractorDocument;
  /**
   * Callback when viewer is closed
   */
  onClose: () => void;
  /**
   * Enable fullscreen mode by default
   */
  defaultFullscreen?: boolean;
  /**
   * Enable zoom controls
   */
  enableZoom?: boolean;
  /**
   * Enable rotation controls (for images)
   */
  enableRotation?: boolean;
  /**
   * Maximum zoom level
   */
  maxZoom?: number;
  /**
   * Minimum zoom level
   */
  minZoom?: number;
}

/**
 * DocumentViewer - Enhanced document preview component
 */
export function DocumentViewer({
  document,
  onClose,
  defaultFullscreen = true,
  enableZoom = true,
  enableRotation = true,
  maxZoom = 3,
  minZoom = 0.25
}: DocumentViewerProps) {
  // 🟢 WORKING: State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewData, setPreviewData] = useState<DocumentPreviewData | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  
  // Refs for document container
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * Determine file type from MIME type or extension
   */
  const getFileType = useCallback((document: ContractorDocument): 'pdf' | 'image' | 'unsupported' => {
    const mimeType = document.mimeType?.toLowerCase() || '';
    const fileName = document.fileName.toLowerCase();
    
    // Check MIME type first
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    
    // Check file extension
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
        setError('This file type is not supported for preview. Please download to view.');
        return;
      }

      // Retrieve file from Neon storage
      const fileData = await contractorDocumentService.retrieveDocument(document.id);

      // Create blob URL for viewing
      const blob = new Blob([fileData.fileData], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);

      // Create preview data
      const preview: DocumentPreviewData = {
        documentId: document.id,
        fileUrl: url,
        fileName: fileData.fileName,
        mimeType: fileData.mimeType,
        fileSize: fileData.fileSize,
        metadata: {
          documentType: document.documentType,
          uploadedAt: document.createdAt,
          expiryDate: document.expiryDate
        }
      };

      // For PDFs, we would typically get page count from a PDF library
      // For now, we'll assume single page for images and unknown for PDFs
      if (fileType === 'pdf') {
        // 🟡 PARTIAL: Would use PDF.js or similar library to get actual page count
        preview.pages = 1;
        setTotalPages(1);
      } else {
        preview.pages = 1;
        setTotalPages(1);
      }

      setPreviewData(preview);

    } catch (err) {
      log.error('Failed to load document preview:', { data: err }, 'DocumentViewer');
      setError('Failed to load document preview');
      toast.error('Failed to load document preview');
    } finally {
      setIsLoading(false);
    }
  }, [document, getFileType]);

  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    if (zoom < maxZoom) {
      setZoom(prev => Math.min(prev + 0.25, maxZoom));
    }
  }, [zoom, maxZoom]);

  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    if (zoom > minZoom) {
      setZoom(prev => Math.max(prev - 0.25, minZoom));
    }
  }, [zoom, minZoom]);

  /**
   * Reset zoom to fit
   */
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  /**
   * Handle rotation
   */
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  /**
   * Handle page navigation (for multi-page PDFs)
   */
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /**
   * Download document
   */
  const handleDownload = useCallback(async () => {
    try {
      // Retrieve file from Neon storage for download
      const fileData = await contractorDocumentService.retrieveDocument(document.id);
      const blob = new Blob([fileData.fileData], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileData.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // Trigger download
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success('Download started');
    } catch (error) {
      log.error('Failed to download document:', { data: error }, 'DocumentViewer');
      toast.error('Failed to download document');
    }
  }, [document]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      handleZoomIn();
    } else if (event.key === '-') {
      event.preventDefault();
      handleZoomOut();
    } else if (event.key === '0') {
      event.preventDefault();
      handleZoomReset();
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      handleRotate();
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      toggleFullscreen();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePreviousPage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextPage();
    }
  }, [onClose, handleZoomIn, handleZoomOut, handleZoomReset, handleRotate, toggleFullscreen, handlePreviousPage, handleNextPage]);

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get document type icon
   */
  const getDocumentIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  /**
   * Render document content based on type
   */
  const renderDocumentContent = () => {
    if (!previewData || !documentUrl) return null;

    const fileType = getFileType(document);

    if (fileType === 'image') {
      return (
        <img
          src={documentUrl}
          alt={previewData.fileName}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            maxWidth: 'none',
            height: 'auto',
            transition: 'transform 0.3s ease'
          }}
          className="mx-auto"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load image');
            setIsLoading(false);
          }}
        />
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="w-full h-full">
          {/* 🟡 PARTIAL: PDF viewer implementation */}
          {/* This would typically use PDF.js or react-pdf for proper PDF rendering */}
          <iframe
            src={`${documentUrl}#page=${currentPage}&zoom=${zoom * 100}`}
            className="w-full h-full border-0"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            title={previewData.fileName}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load PDF');
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    return null;
  };

  // Load preview data on mount
  useEffect(() => {
    loadPreviewData();
  }, [loadPreviewData]);

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentUrl]);

  // Setup keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const fileType = getFileType(document);

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-90 z-50 ${
        isFullscreen ? '' : 'p-4'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className={`bg-white shadow-xl flex flex-col ${
          isFullscreen 
            ? 'w-full h-full' 
            : 'w-full max-w-6xl mx-auto h-full max-h-[90vh] rounded-lg overflow-hidden'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {getDocumentIcon(fileType)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {previewData?.fileName || document.fileName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{document.documentType.replace('_', ' ')}</span>
                {previewData?.fileSize && (
                  <span>{formatFileSize(previewData.fileSize)}</span>
                )}
                <span>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {enableZoom && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= minZoom}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= maxZoom}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Rotation Control */}
            {enableRotation && fileType === 'image' && (
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}
            
            {/* Page Navigation */}
            {fileType === 'pdf' && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-800"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" label="Loading document..." />
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Not Available</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to View
                </button>
              </div>
            </div>
          )}
          
          {!isLoading && !error && (
            <div 
              ref={contentRef}
              className="flex items-center justify-center min-h-full p-4"
            >
              {renderDocumentContent()}
            </div>
          )}
        </div>
        
        {/* Footer with keyboard shortcuts */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {enableZoom && (
                <span>Zoom: +/- keys</span>
              )}
              {enableRotation && fileType === 'image' && (
                <span>Rotate: R key</span>
              )}
              {fileType === 'pdf' && totalPages > 1 && (
                <span>Navigate: ← → keys</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Press Esc to close</span>
              <span>•</span>
              <span>F for fullscreen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}