/**
 * DocumentViewerNavigation - Page navigation controls for multi-page documents
 * Extracted from DocumentViewer for constitutional compliance
 * Focused component <100 lines
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentViewerNavigationProps {
  currentPage: number;
  totalPages: number;
  showControls: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
}

export function DocumentViewerNavigation({
  currentPage,
  totalPages,
  showControls,
  onPreviousPage,
  onNextPage,
  onGoToPage,
}: DocumentViewerNavigationProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      onGoToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Update input when current page changes externally
  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  if (!showControls) return null;

  return (
    <div className="document-viewer-navigation absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-lg p-2 flex items-center gap-2 text-white">
      {/* Previous page */}
      <button
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        className="p-2 rounded hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page input */}
      <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
        <span className="text-sm">Page</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={handlePageInputChange}
          className="w-16 px-2 py-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-center text-sm text-white placeholder-gray-300 focus:outline-none focus:bg-opacity-30"
        />
        <span className="text-sm">of {totalPages}</span>
      </form>

      {/* Next page */}
      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className="p-2 rounded hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}