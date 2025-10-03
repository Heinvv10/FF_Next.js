/**
 * DocumentViewerToolbar - Toolbar with document controls and info
 * Split from DocumentViewer.tsx to meet constitutional requirements (<200 lines)
 * @module DocumentViewerToolbar
 */

import React from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { DocumentPreviewData } from '../types/documentApproval.types';
import { 
  formatFileSize, 
  getDocumentIcon, 
  FileType,
  getZoomDisplayText,
  getPageNavigationInfo
} from '../../../utils/documentViewerUtils';

interface DocumentViewerToolbarProps {
  /**
   * Document being viewed
   */
  document: ContractorDocument;
  /**
   * Preview data with file info
   */
  previewData: DocumentPreviewData | null;
  /**
   * File type
   */
  fileType: FileType;
  /**
   * Current zoom level
   */
  zoom: number;
  /**
   * Minimum zoom level
   */
  minZoom: number;
  /**
   * Maximum zoom level
   */
  maxZoom: number;
  /**
   * Current page number
   */
  currentPage: number;
  /**
   * Total pages
   */
  totalPages: number;
  /**
   * Whether in fullscreen mode
   */
  isFullscreen: boolean;
  /**
   * Whether zoom controls are enabled
   */
  enableZoom: boolean;
  /**
   * Whether rotation controls are enabled
   */
  enableRotation: boolean;
  /**
   * Zoom in handler
   */
  onZoomIn: () => void;
  /**
   * Zoom out handler
   */
  onZoomOut: () => void;
  /**
   * Rotate handler
   */
  onRotate: () => void;
  /**
   * Previous page handler
   */
  onPreviousPage: () => void;
  /**
   * Next page handler
   */
  onNextPage: () => void;
  /**
   * Download handler
   */
  onDownload: () => void;
  /**
   * Fullscreen toggle handler
   */
  onToggleFullscreen: () => void;
  /**
   * Close handler
   */
  onClose: () => void;
}

/**
 * DocumentViewerToolbar - Render toolbar with document controls
 */
export function DocumentViewerToolbar({
  document,
  previewData,
  fileType,
  zoom,
  minZoom,
  maxZoom,
  currentPage,
  totalPages,
  isFullscreen,
  enableZoom,
  enableRotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onPreviousPage,
  onNextPage,
  onDownload,
  onToggleFullscreen,
  onClose
}: DocumentViewerToolbarProps) {
  const pageInfo = getPageNavigationInfo(currentPage, totalPages);
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      {/* Document Info */}
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
      
      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        {enableZoom && (
          <div className="flex items-center gap-1">
            <button
              onClick={onZoomOut}
              disabled={zoom <= minZoom}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded">
              {getZoomDisplayText(zoom)}
            </span>
            
            <button
              onClick={onZoomIn}
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
            onClick={onRotate}
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
              onClick={onPreviousPage}
              disabled={!pageInfo.canGoPrevious}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded">
              {pageInfo.displayText}
            </span>
            
            <button
              onClick={onNextPage}
              disabled={!pageInfo.canGoNext}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Download Button */}
        <button
          onClick={onDownload}
          className="p-2 text-gray-600 hover:text-gray-800"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
        
        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
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
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}