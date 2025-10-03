/**
 * Performance Header Component
 * Header with actions for performance dashboard
 * @module PerformanceDashboard
 */

import React from 'react';
import { RefreshCw, Filter, Calendar } from 'lucide-react';

interface PerformanceHeaderProps {
  isRefreshing: boolean;
  showFilters: boolean;
  showFiltersPanel: boolean;
  lastRefresh: Date | null;
  onRefresh: () => void;
  onToggleFilters: () => void;
}

export function PerformanceHeader({
  isRefreshing,
  showFilters,
  showFiltersPanel,
  lastRefresh,
  onRefresh,
  onToggleFilters
}: PerformanceHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">
            Comprehensive contractor performance tracking and RAG score analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Filters Toggle */}
          {showFilters && (
            <button
              onClick={onToggleFilters}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showFiltersPanel
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>
      </div>

      {/* Last Refresh Indicator */}
      {lastRefresh && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </>
  );
}