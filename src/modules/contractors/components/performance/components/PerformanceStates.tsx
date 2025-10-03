/**
 * Performance States Component
 * Loading, error, and empty states for performance dashboard
 * @module PerformanceDashboard
 */

import React from 'react';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PerformanceStatesProps {
  isLoading: boolean;
  error: string | null;
  data: any;
  onRetry: () => void;
}

export function PerformanceStates({
  isLoading,
  error,
  data,
  onRetry
}: PerformanceStatesProps) {
  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading performance analytics..." />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Failed to Load Performance Data
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Performance Data Available
        </h3>
        <p className="text-gray-600">
          Performance analytics will appear here once contractor data is available.
        </p>
      </div>
    );
  }

  return null;
}