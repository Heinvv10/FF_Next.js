/**
 * Alerts List Component
 * List of active system alerts
 * @module PerformanceMonitoring
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { HealthStatus } from '../../../hooks/usePerformanceMonitoring';

interface AlertsListProps {
  healthData: HealthStatus;
}

export function AlertsList({ healthData }: AlertsListProps) {
  if (healthData.alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Active Alerts
      </h3>
      <div className="space-y-3">
        {healthData.alerts.map((alert, index) => (
          <div key={index} className={`p-4 rounded-lg border ${
            alert.level === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className={`w-4 h-4 mr-2 ${
                  alert.level === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <span className="font-medium">{alert.message}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {Object.keys(alert.details).length > 0 && (
              <div className="mt-2 pl-6">
                <pre className="text-xs text-gray-600 bg-white p-2 rounded border">
                  {JSON.stringify(alert.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}