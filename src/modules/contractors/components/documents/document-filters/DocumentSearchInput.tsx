/**
 * Document Search Input Component
 * Handles search functionality with suggestions
 * @module DocumentFilters
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { useDocumentFiltersReturn } from '../../../hooks/useDocumentFilters';

interface DocumentSearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hookState: useDocumentFiltersReturn;
}

export function DocumentSearchInput({ searchTerm, onSearchChange, hookState }: DocumentSearchInputProps) {
  const { isSearchFocused, searchSuggestions, handleSearchChange, setIsSearchFocused } = hookState;

  return (
    <div className="flex-1 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          placeholder="Search documents by name, type, or number..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {isSearchFocused && searchSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onSearchChange(suggestion);
                setIsSearchFocused(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              <Search className="w-3 h-3 text-gray-400 inline mr-2" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}