/**
 * PerformanceMetricsGrid Component
 * Displays grid of key performance metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERFORMANCE_METRICS } from '../data/mockMetrics';

export function PerformanceMetricsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PERFORMANCE_METRICS.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <CardTitle className="text-sm">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metric.value}</div>
            <div
              className={`text-sm mt-1 ${
                metric.isPositive ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {metric.trend}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
