/**
 * DocumentViewerContent - Document content display area
 * Split from DocumentViewer.tsx to meet constitutional requirements (<200 lines)
 * @module DocumentViewerContent
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DocumentPreviewData } from '../types/documentApproval.types';
import { FileType } from '../../../utils/documentViewerUtils';

interface DocumentViewerContentProps {
  /**
   * Whether content is loading
   */
  isLoading: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * Preview data
   */
  previewData: DocumentPreviewData | null;
  /**
   * Document URL for display
   */
  documentUrl: string | null;
  /**
   * File type
   */
  fileType: FileType;
  /**
   * Current zoom level
   */
  zoom: number;
  /**
   * Current rotation angle
   */
  rotation: number;
  /**
   * Current page (for PDFs)
   */
  currentPage: number;
  /**
   * Content container ref
   */
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * DocumentViewerContent - Render document content based on file type
 */
export function DocumentViewerContent({
  isLoading,
  error,
  previewData,
  documentUrl,
  fileType,
  zoom,
  rotation,
  currentPage,
  contentRef
}: DocumentViewerContentProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Display Document</h3>
          <p className="text-sm text-gray-600 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  // No preview data
  if (!previewData || !documentUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Preview Available</h3>
          <p className="text-sm text-gray-600">Unable to generate preview for this document.</p>
        </div>
      </div>
    );
  }

  // Unsupported file type
  if (fileType === 'unsupported') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsupported File Format</h3>
          <p className="text-sm text-gray-600 mb-4">
            This file format cannot be previewed in the browser.
          </p>
          <p className="text-xs text-gray-500">
            Please download the file to view it with an appropriate application.
          </p>
        </div>
      </div>
    );
  }

  // Content display styles
  const contentStyle: React.CSSProperties = {
    transform: `scale(${zoom}) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease-in-out'
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-4">
      <div className="flex items-center justify-center min-h-full">
        <div ref={contentRef} className="max-w-full max-h-full">
          {/* PDF Display */}
          {fileType === 'pdf' && (
            <div style={contentStyle}>
              <embed
                src={`${documentUrl}#page=${currentPage}&zoom=${zoom * 100}`}
                type="application/pdf"
                className="w-full h-full shadow-lg rounded-lg bg-white"
                style={{
                  minWidth: '800px',
                  minHeight: '600px',
                  width: '100%',
                  height: 'calc(100vh - 200px)'
                }}
                title={`${previewData.fileName} - Page ${currentPage}`}
              />
            </div>
          )}

          {/* Image Display */}
          {fileType === 'image' && (
            <div style={contentStyle} className="inline-block">
              <img
                src={documentUrl}
                alt={previewData.fileName}
                className="max-w-full max-h-full shadow-lg rounded-lg bg-white"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}