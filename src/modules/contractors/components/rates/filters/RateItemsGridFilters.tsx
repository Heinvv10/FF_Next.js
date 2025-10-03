/**
 * RateItemsGrid Filters Component
 * Handles search, category filtering, and negotiable filtering
 * Extracted to comply with constitutional 300-line limit
 */

import React from 'react';
import { Search } from 'lucide-react';

export interface RateItemsGridFiltersProps {
  searchTerm: string;
  selectedCategory: 'deliverable' | 'service' | '';
  showOnlyNegotiable: boolean;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: 'deliverable' | 'service' | '') => void;
  onNegotiableChange: (show: boolean) => void;
}

export function RateItemsGridFilters({
  searchTerm,
  selectedCategory,
  showOnlyNegotiable,
  onSearchChange,
  onCategoryChange,
  onNegotiableChange
}: RateItemsGridFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search services by name, code, or unit..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Category filter */}
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value as 'deliverable' | 'service' | '')}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        <option value="">All Categories</option>
        <option value="deliverable">Deliverables</option>
        <option value="service">Services</option>
      </select>

      {/* Negotiable filter */}
      <label className="flex items-center space-x-2 px-3 py-2">
        <input
          type="checkbox"
          checked={showOnlyNegotiable}
          onChange={(e) => onNegotiableChange(e.target.checked)}
          className="rounded text-sm"
        />
        <span className="text-sm text-gray-700">Negotiable only</span>
      </label>
    </div>
  );
}