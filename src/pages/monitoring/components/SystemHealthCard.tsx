/**
 * SystemHealthCard Component
 * Displays overall system health status and uptime
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealth } from '../types/monitoring.types';
import { getStatusColor } from '../utils/monitoringHelpers';
import { TARGET_SLA } from '../data/performanceBudgets';

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
}

export function SystemHealthCard({ systemHealth }: SystemHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`px-4 py-2 rounded-lg font-semibold uppercase text-sm ${getStatusColor(
                systemHealth.status
              )}`}
            >
              {systemHealth.status}
            </div>
            <div>
              <div className="text-2xl font-bold">
                {systemHealth.uptime.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Uptime (30 days)</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Target SLA</div>
            <div className="text-2xl font-bold">{TARGET_SLA}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
