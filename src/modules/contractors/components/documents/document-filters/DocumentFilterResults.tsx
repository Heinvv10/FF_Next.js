/**
 * Document Filter Results Component
 * Shows results summary and statistics
 * @module DocumentFilters
 */

import React from 'react';

interface DocumentFilterResultsProps {
  totalCount: number;
  filteredCount: number;
  getFilterSummary: string;
}

export function DocumentFilterResults({ totalCount, filteredCount, getFilterSummary }: DocumentFilterResultsProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <div className="text-sm text-gray-600">
        {filteredCount === totalCount ? (
          <span>Showing all {totalCount} documents</span>
        ) : (
          <span>
            Showing {filteredCount} of {totalCount} documents
            {getFilterSummary && (
              <span className="text-gray-500"> • {getFilterSummary}</span>
            )}
          </span>
        )}
      </div>

      {filteredCount !== totalCount && (
        <div className="text-xs text-gray-500">
          {Math.round((filteredCount / totalCount) * 100)}% of total
        </div>
      )}
    </div>
  );
}