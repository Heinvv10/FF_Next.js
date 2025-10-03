/**
 * Document Filters Hook
 * Business logic for document filtering functionality
 * @module DocumentFilters
 */

import { useState, useMemo, useCallback } from 'react';
import { DocumentFiltersProps, DocumentFilterState, DocumentFilterActions, DEFAULT_PRESETS, DOCUMENT_TYPE_OPTIONS } from '../components/documents/types/documentFilters.types';

export function useDocumentFilters(props: DocumentFiltersProps) {
  // Component state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      props.searchTerm.trim() !== '' ||
      props.statusFilter !== 'all' ||
      props.documentTypeFilter !== 'all' ||
      props.expiryFilter !== 'all'
    );
  }, [props.searchTerm, props.statusFilter, props.documentTypeFilter, props.expiryFilter]);

  /**
   * Get filter summary text
   */
  const getFilterSummary = useMemo(() => {
    const activeFilters: string[] = [];

    if (props.statusFilter !== 'all') {
      activeFilters.push(props.statusFilter.replace('_', ' '));
    }

    if (props.documentTypeFilter !== 'all') {
      const typeOption = DOCUMENT_TYPE_OPTIONS?.find(opt => opt.value === props.documentTypeFilter);
      if (typeOption) {
        activeFilters.push(typeOption.label);
      }
    }

    if (props.expiryFilter !== 'all') {
      activeFilters.push(`${props.expiryFilter} documents`);
    }

    if (props.searchTerm.trim()) {
      activeFilters.push(`matching "${props.searchTerm}"`);
    }

    return activeFilters.length > 0 ? activeFilters.join(', ') : '';
  }, [props.statusFilter, props.documentTypeFilter, props.expiryFilter, props.searchTerm]);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    props.onSearchChange('');
    props.onStatusFilterChange('all');
    props.onDocumentTypeFilterChange('all');
    props.onExpiryFilterChange('all');
    setSelectedPreset(null);
    props.onPresetChange?.(null);
  }, [props.onSearchChange, props.onStatusFilterChange, props.onDocumentTypeFilterChange, props.onExpiryFilterChange, props.onPresetChange]);

  /**
   * Apply preset filters
   */
  const applyPreset = useCallback((preset: FilterPreset) => {
    props.onStatusFilterChange(preset.filters.status);
    props.onDocumentTypeFilterChange(preset.filters.documentType);
    props.onExpiryFilterChange(preset.filters.expiry);
    if (preset.filters.search) {
      props.onSearchChange(preset.filters.search);
    }
    setSelectedPreset(preset);
    props.onPresetChange?.(preset);
  }, [props.onStatusFilterChange, props.onDocumentTypeFilterChange, props.onExpiryFilterChange, props.onSearchChange, props.onPresetChange]);

  /**
   * Handle search input with debouncing
   */
  const handleSearchChange = useCallback((value: string) => {
    props.onSearchChange(value);

    // Generate search suggestions (basic implementation)
    if (value.trim().length > 2) {
      const suggestions = [
        `${value} certificate`,
        `${value} document`,
        `${value} registration`
      ].filter(s => s.toLowerCase() !== value.toLowerCase());
      setSearchSuggestions(suggestions.slice(0, 3));
    } else {
      setSearchSuggestions([]);
    }
  }, [props.onSearchChange]);

  /**
   * Get status filter icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Clock';
      case 'approved':
      case 'verified':
        return 'CheckCircle2';
      case 'rejected':
        return 'XCircle';
      case 'expired':
        return 'AlertTriangle';
      default:
        return 'FileText';
    }
  };

  /**
   * Get active filter count
   */
  const getActiveFilterCount = useCallback(() => {
    return [
      props.searchTerm && 1,
      props.statusFilter !== 'all' && 1,
      props.documentTypeFilter !== 'all' && 1,
      props.expiryFilter !== 'all' && 1
    ].filter(Boolean).length;
  }, [props.searchTerm, props.statusFilter, props.documentTypeFilter, props.expiryFilter]);

  return {
    // State
    showAdvanced,
    selectedPreset,
    isSearchFocused,
    searchSuggestions,

    // Computed values
    hasActiveFilters,
    getFilterSummary,
    getStatusIcon,
    getActiveFilterCount,

    // Actions
    setShowAdvanced,
    setIsSearchFocused,
    setSearchSuggestions,
    clearAllFilters,
    applyPreset,
    handleSearchChange
  };
}

export type useDocumentFiltersReturn = ReturnType<typeof useDocumentFilters>;