/**
 * Monitoring States Component
 * Loading, error, and empty states for performance monitoring
 * @module PerformanceMonitoring
 */

import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface MonitoringStatesProps {
  isLoading: boolean;
  error: string | null;
  healthData: any;
  onRetry: () => void;
}

export function MonitoringStates({
  isLoading,
  error,
  healthData,
  onRetry
}: MonitoringStatesProps) {
  // Loading state
  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading performance data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading performance data: {error}</span>
        </div>
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!healthData) {
    return (
      <div className="text-center p-8 text-gray-500">
        No performance data available
      </div>
    );
  }

  return null;
}