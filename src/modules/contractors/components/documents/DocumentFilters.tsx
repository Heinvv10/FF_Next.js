/**
 * DocumentFilters Component - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 499 lines to <200 lines by using hooks and sub-components
 * @module DocumentFilters
 */

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { DocumentFiltersProps, DEFAULT_PRESETS } from './types/documentFilters.types';
import { useDocumentFilters } from '../../hooks/useDocumentFilters';
import {
  DocumentSearchInput,
  DocumentStatusFilter,
  DocumentFilterPresets,
  DocumentAdvancedFilters,
  DocumentFilterResults
} from './document-filters';

/**
 * DocumentFilters - Advanced filtering interface (Refactored)
 */
export function DocumentFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  documentTypeFilter,
  onDocumentTypeFilterChange,
  expiryFilter,
  onExpiryFilterChange,
  totalCount,
  filteredCount,
  enableAdvancedFilters = true,
  enablePresets = true,
  presets = DEFAULT_PRESETS,
  onPresetChange
}: DocumentFiltersProps) {
  // Use custom hook for business logic
  const hookState = useDocumentFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    documentTypeFilter,
    onDocumentTypeFilterChange,
    expiryFilter,
    onExpiryFilterChange,
    totalCount,
    filteredCount,
    enableAdvancedFilters,
    enablePresets,
    presets,
    onPresetChange
  });

  const {
    showAdvanced,
    selectedPreset,
    hasActiveFilters,
    getFilterSummary,
    getActiveFilterCount,
    setShowAdvanced,
    clearAllFilters,
    applyPreset
  } = hookState;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search and Quick Filters Row */}
      <div className="flex items-center gap-4">
        <DocumentSearchInput
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          hookState={hookState}
        />

        <DocumentStatusFilter
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />

        {/* Advanced Filters Toggle */}
        {enableAdvancedFilters && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            title="Clear all filters"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Presets */}
      {enablePresets && (
        <DocumentFilterPresets
          presets={presets}
          selectedPreset={selectedPreset}
          applyPreset={applyPreset}
        />
      )}

      {/* Advanced Filters */}
      {enableAdvancedFilters && showAdvanced && (
        <DocumentAdvancedFilters
          documentTypeFilter={documentTypeFilter}
          onDocumentTypeFilterChange={onDocumentTypeFilterChange}
          expiryFilter={expiryFilter}
          onExpiryFilterChange={onExpiryFilterChange}
          clearAllFilters={clearAllFilters}
        />
      )}

      {/* Results Summary */}
      <DocumentFilterResults
        totalCount={totalCount}
        filteredCount={filteredCount}
        getFilterSummary={getFilterSummary}
      />
    </div>
  );
}