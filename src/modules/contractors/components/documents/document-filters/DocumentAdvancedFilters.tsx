/**
 * Document Advanced Filters Component
 * Advanced filtering options (document type, expiry)
 * @module DocumentFilters
 */

import React from 'react';
import { FileText, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { DOCUMENT_TYPE_OPTIONS } from '../types/documentFilters.types';

interface DocumentAdvancedFiltersProps {
  documentTypeFilter: string;
  onDocumentTypeFilterChange: (type: string) => void;
  expiryFilter: string;
  onExpiryFilterChange: (expiry: string) => void;
  clearAllFilters: () => void;
}

export function DocumentAdvancedFilters({
  documentTypeFilter,
  onDocumentTypeFilterChange,
  expiryFilter,
  onExpiryFilterChange,
  clearAllFilters
}: DocumentAdvancedFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
      {/* Document Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type
        </label>
        <div className="relative">
          <select
            value={documentTypeFilter}
            onChange={(e) => onDocumentTypeFilterChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Expiry Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiry Status
        </label>
        <div className="relative">
          <select
            value={expiryFilter}
            onChange={(e) => onExpiryFilterChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            <option value="all">All Documents</option>
            <option value="valid">Valid Documents</option>
            <option value="expiring">Expiring Soon (30 days)</option>
            <option value="expired">Expired Documents</option>
          </select>
          <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex items-end">
        <button
          onClick={clearAllFilters}
          className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Filters
        </button>
      </div>
    </div>
  );
}