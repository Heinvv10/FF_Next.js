/**
 * DocumentViewerError - Error display component for document viewer
 * Extracted from DocumentViewer for constitutional compliance
 * Focused component <100 lines
 */

import React from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';

interface DocumentViewerErrorProps {
  error: string;
  document: ContractorDocument;
  onClose: () => void;
  onRetry: () => void;
  onClearError: () => void;
}

export function DocumentViewerError({
  error,
  document,
  onClose,
  onRetry,
  onClearError,
}: DocumentViewerErrorProps) {
  return (
    <div className="document-viewer-error fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to Load Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error details */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Document: <span className="font-medium">{document.name}</span>
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClearError();
              onRetry();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}