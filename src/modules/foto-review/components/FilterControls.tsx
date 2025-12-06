/**
 * FilterControls Component
 * Provides filtering options for the DR list (project, date range, evaluation status)
 */

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOptions {
  project: string;
  startDate: string;
  endDate: string;
  status: 'all' | 'evaluated' | 'pending';
}

interface FilterControlsProps {
  projects: string[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export function FilterControls({
  projects,
  filters,
  onFilterChange,
  onClearFilters,
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProjectChange = (project: string) => {
    onFilterChange({ ...filters, project });
  };

  const handleStartDateChange = (startDate: string) => {
    onFilterChange({ ...filters, startDate });
  };

  const handleEndDateChange = (endDate: string) => {
    onFilterChange({ ...filters, endDate });
  };

  const handleStatusChange = (status: 'all' | 'evaluated' | 'pending') => {
    onFilterChange({ ...filters, status });
  };

  const hasActiveFilters =
    filters.project !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.status !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700" role="region" aria-label="Filter controls">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded={isExpanded}
        aria-controls="filter-options"
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} filters${hasActiveFilters ? ' (active filters applied)' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full" aria-label="Active filters">
              Active
            </span>
          )}
        </div>
        <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Filter Options */}
      {isExpanded && (
        <div id="filter-options" className="px-4 pb-4 space-y-4"  role="group" aria-label="Filter options">
          {/* Project Filter */}
          <div>
            <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              id="project-filter"
              value={filters.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="start-date" className="sr-only">Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Start date"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="sr-only">End Date</label>
                <input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Evaluation Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value as 'all' | 'evaluated' | 'pending')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All</option>
              <option value="evaluated">Evaluated</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Clear all active filters"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
