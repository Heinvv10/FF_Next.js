/**
 * Health Checks List Component
 * List of individual health check results
 * @module PerformanceMonitoring
 */

import React from 'react';
import { Server, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { HealthStatus } from '../../../hooks/usePerformanceMonitoring';

interface HealthChecksListProps {
  healthData: HealthStatus;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatDuration: (milliseconds: number) => string;
}

export function HealthChecksList({
  healthData,
  getStatusColor,
  getStatusIcon,
  formatDuration
}: HealthChecksListProps) {
  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'check-circle':
        return <CheckCircle className="w-4 h-4" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Server className="w-5 h-5 mr-2" />
        Health Checks
      </h3>
      <div className="space-y-3">
        {healthData.checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                {getIconComponent(getStatusIcon(check.status) as string)}
                <span className="ml-1 capitalize">{check.status}</span>
              </div>
              <span className="ml-3 font-medium">{check.name.replace(/_/g, ' ')}</span>
              <span className="ml-2 text-sm text-gray-500">({formatDuration(check.duration)})</span>
            </div>
            {check.message && (
              <span className="text-sm text-gray-600">{check.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}