/**
 * RateLimitingCard Component
 * Displays rate limiting metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RATE_LIMIT_METRICS } from '../data/mockMetrics';

export function RateLimitingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Limiting</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {RATE_LIMIT_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{metric.label}</div>
                <div className="text-sm text-gray-600">{metric.description}</div>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
