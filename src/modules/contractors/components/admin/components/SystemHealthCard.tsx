/**
 * System Health Card Component
 * Overall system health status display
 * @module PerformanceMonitoring
 */

import React from 'react';
import { CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { HealthStatus } from '../../../hooks/usePerformanceMonitoring';

interface SystemHealthCardProps {
  healthData: HealthStatus;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatUptime: (milliseconds: number) => string;
}

export function SystemHealthCard({
  healthData,
  getStatusColor,
  getStatusIcon,
  formatUptime
}: SystemHealthCardProps) {
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Health</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
          {getIconComponent(getStatusIcon(healthData.status) as string)}
          <span className="ml-2 capitalize">{healthData.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatUptime(healthData.uptime)}</div>
          <div className="text-sm text-gray-500">Uptime</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {healthData.checks.filter(c => c.status === 'pass').length}/{healthData.checks.length}
          </div>
          <div className="text-sm text-gray-500">Checks Passing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{healthData.alerts.length}</div>
          <div className="text-sm text-gray-500">Active Alerts</div>
        </div>
      </div>
    </div>
  );
}