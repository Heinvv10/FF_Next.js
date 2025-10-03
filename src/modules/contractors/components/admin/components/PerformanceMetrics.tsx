/**
 * Performance Metrics Component
 * API operations and database query performance metrics
 * @module PerformanceMonitoring
 */

import React from 'react';
import { Zap, Database } from 'lucide-react';
import { HealthStatus } from '../../../hooks/usePerformanceMonitoring';

interface PerformanceMetricsProps {
  healthData: HealthStatus;
  formatDuration: (milliseconds: number) => string;
  formatPercentage: (value: number) => string;
}

export function PerformanceMetrics({
  healthData,
  formatDuration,
  formatPercentage
}: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* API Operations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          API Operations
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-xl font-bold text-blue-600">{healthData.performance.operations.totalOperations}</div>
            <div className="text-sm text-gray-600">Total Ops</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-xl font-bold text-green-600">
              {formatPercentage(healthData.performance.operations.successRate)}
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-xl font-bold text-yellow-600">
              {formatDuration(healthData.performance.operations.averageResponseTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-xl font-bold text-red-600">{healthData.performance.operations.slowOperations}</div>
            <div className="text-sm text-gray-600">Slow Ops</div>
          </div>
        </div>

        {healthData.performance.operations.topSlowOperations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Slowest Operations</h4>
            <div className="space-y-2">
              {healthData.performance.operations.topSlowOperations.map((op, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-600">{op.operation}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">({op.count}x)</span>
                    <span className="font-medium">{formatDuration(op.avgDuration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Queries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Queries
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-xl font-bold text-blue-600">{healthData.performance.queries.totalQueries}</div>
            <div className="text-sm text-gray-600">Total Queries</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-xl font-bold text-green-600">
              {formatDuration(healthData.performance.queries.averageQueryTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Query Time</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-xl font-bold text-red-600">{healthData.performance.queries.slowQueries}</div>
            <div className="text-sm text-gray-600">Slow Queries</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-xl font-bold text-purple-600">
              {healthData.performance.queries.totalQueries > 0 ?
                formatPercentage(healthData.performance.queries.slowQueries / healthData.performance.queries.totalQueries) :
                '0%'
              }
            </div>
            <div className="text-sm text-gray-600">Slow Rate</div>
          </div>
        </div>

        {healthData.performance.queries.topSlowQueries.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Slowest Queries</h4>
            <div className="space-y-2">
              {healthData.performance.queries.topSlowQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-600 truncate max-w-xs" title={query.query}>
                    {query.query}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">({query.count}x)</span>
                    <span className="font-medium">{formatDuration(query.avgDuration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}