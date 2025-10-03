/**
 * ApplicationFilters - Filter and search controls for applications
 */

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { ApplicationFilter } from './ApplicationTypes';

interface ApplicationFiltersProps {
  filters: ApplicationFilter;
  onFiltersChange: (filters: Partial<ApplicationFilter>) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ApplicationFilters({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading = false
}: ApplicationFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, contact person, or email..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter and Actions */}
        <div className="flex items-center space-x-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh applications"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Advanced Filters (expandable if needed) */}
      {(filters.dateRange.start || filters.dateRange.end) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => onFiltersChange({
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => onFiltersChange({
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End date"
            />
            {(filters.dateRange.start || filters.dateRange.end) && (
              <button
                onClick={() => onFiltersChange({
                  dateRange: { start: '', end: '' }
                })}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}