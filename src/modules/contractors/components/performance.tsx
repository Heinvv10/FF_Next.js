/**
 * PerformanceDashboard - Comprehensive contractor performance analytics
 * Complete performance tracking with metrics, trends, and detailed analysis
 */

import React from 'react';
import { AlertCircle, TrendingUp, BarChart3, Target } from 'lucide-react';
import { useContractorPerformance } from '../hooks/useContractorPerformance';
import { PerformanceMetrics } from './performance/PerformanceMetrics';
import { PerformanceTable } from './performance/PerformanceTable';
import { PerformanceFilters } from './performance/PerformanceFilters';

export function PerformanceDashboard() {
  const {
    contractors,
    metrics,
    filters,
    isLoading,
    error,
    setFilters,
    refreshData,
  } = useContractorPerformance();

  const handleSort = (sortBy: string) => {
    if (filters.sortBy === sortBy) {
      setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      setFilters({ sortBy, sortOrder: 'desc' });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Analytics</h2>
        <p className="text-gray-600">Monitor contractor performance metrics, quality scores, and project completion rates</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Performance Metrics Overview */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
        </div>
        <PerformanceMetrics metrics={metrics} />
      </div>

      {/* Filters */}
      <PerformanceFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refreshData}
        isLoading={isLoading}
      />

      {/* Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Contractor Performance Details</h3>
            </div>
            <div className="text-sm text-gray-500">
              {contractors.length} contractors
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading performance data...</span>
          </div>
        ) : (
          <PerformanceTable
            contractors={contractors}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
          />
        )}
      </div>

      {/* Insights Section */}
      {!isLoading && contractors.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Performance Insights</h3>
              <div className="text-blue-800 space-y-1">
                <p>• Average performance score across all contractors: {metrics.overallPerformance.toFixed(1)}%</p>
                <p>• {metrics.ragDistribution.green} contractors rated as low risk (Green)</p>
                <p>• {metrics.ragDistribution.amber} contractors require attention (Amber)</p>
                {metrics.ragDistribution.red > 0 && <p>• {metrics.ragDistribution.red} contractors need immediate review (Red)</p>}
                <p>• Overall project completion rate: {metrics.projectCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}