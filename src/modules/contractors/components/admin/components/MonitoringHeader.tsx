/**
 * Monitoring Header Component
 * Header with auto-refresh controls for performance monitoring
 * @module PerformanceMonitoring
 */

import React from 'react';
import { HealthStatus } from '../../../hooks/usePerformanceMonitoring';

interface MonitoringHeaderProps {
  healthData: HealthStatus | null;
  autoRefresh: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
}

export function MonitoringHeader({
  healthData,
  autoRefresh,
  onToggleAutoRefresh
}: MonitoringHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
        <p className="text-gray-600">Real-time system health and performance metrics</p>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onToggleAutoRefresh(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Auto-refresh</span>
        </label>
        <div className="text-sm text-gray-500">
          Last updated: {healthData ? new Date(healthData.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
}