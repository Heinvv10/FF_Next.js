/**
 * DatabasePerformanceCard Component
 * Displays database performance metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DATABASE_METRICS } from '../data/mockMetrics';
import { getDatabaseStatusColor } from '../utils/monitoringHelpers';

export function DatabasePerformanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATABASE_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="text-sm text-gray-600">{metric.label}</div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div
                className={`text-sm ${getDatabaseStatusColor(metric.status)}`}
              >
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
