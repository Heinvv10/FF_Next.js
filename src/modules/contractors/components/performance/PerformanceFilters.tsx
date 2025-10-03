/**
 * PerformanceFilters - Filter controls for performance data
 */

import React from 'react';
import { Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { PerformanceFilter } from './PerformanceTypes';

interface PerformanceFiltersProps {
  filters: PerformanceFilter;
  onFiltersChange: (filters: Partial<PerformanceFilter>) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function PerformanceFilters({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading = false
}: PerformanceFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* RAG Status Filter */}
          <div className="flex items-center space-x-2">
            <BarChart3 size={20} className="text-gray-400" />
            <select
              value={filters.ragStatus}
              onChange={(e) => onFiltersChange({ ragStatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="green">Green (Low Risk)</option>
              <option value="amber">Amber (Medium Risk)</option>
              <option value="red">Red (High Risk)</option>
            </select>
          </div>

          {/* Project Range Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filters.projectRange}
              onChange={(e) => onFiltersChange({ projectRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Project Counts</option>
              <option value="none">No Projects</option>
              <option value="low">1-4 Projects</option>
              <option value="medium">5-9 Projects</option>
              <option value="high">10+ Projects</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ sortBy: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="companyName">Company Name</option>
              <option value="performanceScore">Performance Score</option>
              <option value="qualityScore">Quality Score</option>
              <option value="safetyScore">Safety Score</option>
              <option value="totalProjects">Total Projects</option>
              <option value="completionRate">Completion Rate</option>
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          title="Refresh performance data"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}