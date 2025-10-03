/**
 * DocumentViewer Component - Refactored main component  
 * Split from original 574-line component to meet constitutional requirements (<200 lines)
 * @module DocumentViewer
 */

import React from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { useDocumentViewer } from '../../hooks/useDocumentViewer';
import { DEFAULT_VIEWER_CONFIG } from '../../utils/documentViewerUtils';

// Sub-components
import { DocumentViewerToolbar } from './document-viewer/DocumentViewerToolbar';
import { DocumentViewerContent } from './document-viewer/DocumentViewerContent';

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
   * Minimum zoom level
   */
  minZoom?: number;
  /**
   * Maximum zoom level
   */
  maxZoom?: number;
  /**
   * Show toolbar
   */
  showToolbar?: boolean;
}

/**
 * DocumentViewer - Interactive document viewer with controls
 * Refactored to use composition pattern with focused sub-components
 */
export function DocumentViewer({
  document,
  onClose,
  defaultFullscreen = false,
  enableZoom = true,
  enableRotation = true,
  minZoom = DEFAULT_VIEWER_CONFIG.minZoom,
  maxZoom = DEFAULT_VIEWER_CONFIG.maxZoom,
  showToolbar = true
}: DocumentViewerProps) {
  // Use custom hook for business logic
  const {
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
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    handleNextPage,
    handlePreviousPage,
    toggleFullscreen,
    handleDownload
  } = useDocumentViewer({
    document,
    defaultFullscreen,
    minZoom,
    maxZoom
  });

  // Container classes based on fullscreen state
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "bg-white rounded-lg shadow-xl flex flex-col h-full max-h-screen";

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Toolbar */}
      {showToolbar && (
        <DocumentViewerToolbar
          document={document}
          previewData={previewData}
          fileType={fileType}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          currentPage={currentPage}
          totalPages={totalPages}
          isFullscreen={isFullscreen}
          enableZoom={enableZoom}
          enableRotation={enableRotation}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRotate={handleRotate}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onDownload={handleDownload}
          onToggleFullscreen={toggleFullscreen}
          onClose={onClose}
        />
      )}

      {/* Content Area */}
      <DocumentViewerContent
        isLoading={isLoading}
        error={error}
        previewData={previewData}
        documentUrl={documentUrl}
        fileType={fileType}
        zoom={zoom}
        rotation={rotation}
        currentPage={currentPage}
        contentRef={contentRef}
      />
    </div>
  );
}