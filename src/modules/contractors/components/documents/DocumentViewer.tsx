/**
 * DocumentViewer Component - Refactored for constitutional compliance  
 * Now uses composition pattern with extracted business logic
 * Reduced from 574 lines to <200 lines by using hooks and sub-components
 * @module DocumentViewer
 */

import React from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { useDocumentViewer } from '../../hooks/useDocumentViewer';
import { DocumentViewerToolbar } from './document-viewer/DocumentViewerToolbar';
import { DocumentViewerContent } from './document-viewer/DocumentViewerContent';
import { DocumentViewerNavigation } from './document-viewer/DocumentViewerNavigation';
import { DocumentViewerError } from './document-viewer/DocumentViewerError';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
   * Zoom step increment
   */
  zoomStep?: number;
}

/**
 * DocumentViewer - Main component using composition pattern
 * Refactored from 574 lines to <200 lines for constitutional compliance
 * Business logic extracted to useDocumentViewer hook
 */
export function DocumentViewer({
  document,
  onClose,
  defaultFullscreen = false,
  enableZoom = true,
  enableRotation = true,
  minZoom = 0.25,
  maxZoom = 5,
  zoomStep = 0.25,
}: DocumentViewerProps) {
  // Extract all business logic to custom hook
  const { state, actions } = useDocumentViewer({
    document,
    defaultFullscreen,
    enableZoom,
    enableRotation,
    minZoom,
    maxZoom,
    zoomStep,
  });

  // Handle loading state
  if (state.isLoading) {
    return (
      <div className="document-viewer-loading fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-lg">Loading document...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (state.error) {
    return (
      <DocumentViewerError
        error={state.error}
        document={document}
        onClose={onClose}
        onRetry={actions.loadDocument}
        onClearError={actions.clearError}
      />
    );
  }

  // Main viewer layout
  return (
    <div 
      className={`document-viewer ${state.isFullscreen ? 'fullscreen' : 'modal'}`}
      onClick={actions.toggleControls}
    >
      {/* Toolbar */}
      <DocumentViewerToolbar
        document={document}
        zoom={state.zoom}
        rotation={state.rotation}
        isFullscreen={state.isFullscreen}
        showControls={state.showControls}
        isDownloading={state.isDownloading}
        enableZoom={enableZoom}
        enableRotation={enableRotation}
        onClose={onClose}
        onZoomIn={actions.zoomIn}
        onZoomOut={actions.zoomOut}
        onResetZoom={actions.resetZoom}
        onRotateClockwise={actions.rotateClockwise}
        onRotateCounterClockwise={actions.rotateCounterClockwise}
        onToggleFullscreen={actions.toggleFullscreen}
        onToggleControls={actions.toggleControls}
        onDownload={actions.downloadDocument}
      />

      {/* Main content area */}
      <DocumentViewerContent
        document={document}
        previewData={state.previewData}
        currentPage={state.currentPage}
        zoom={state.zoom}
        rotation={state.rotation}
        showControls={state.showControls}
        onToggleControls={actions.toggleControls}
      />

      {/* Navigation controls (for multi-page documents) */}
      {state.totalPages > 1 && (
        <DocumentViewerNavigation
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          showControls={state.showControls}
          onPreviousPage={actions.previousPage}
          onNextPage={actions.nextPage}
          onGoToPage={actions.goToPage}
        />
      )}
    </div>
  );
}

/**
 * Default export for backward compatibility
 */
export default DocumentViewer;