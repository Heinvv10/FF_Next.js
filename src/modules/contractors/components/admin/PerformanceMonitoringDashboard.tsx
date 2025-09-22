/**
 * Performance Monitoring Dashboard for Contractors Module
 * Provides real-time monitoring of system health and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Server,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  performance: {
    operations: OperationMetrics;
    queries: QueryMetrics;
  };
  alerts: Alert[];
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  metadata?: Record<string, any>;
}

interface OperationMetrics {
  totalOperations: number;
  averageResponseTime: number;
  successRate: number;
  slowOperations: number;
  topSlowOperations: Array<{
    operation: string;
    avgDuration: number;
    count: number;
  }>;
}

interface QueryMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  topSlowQueries: Array<{
    query: string;
    avgDuration: number;
    count: number;
  }>;
}

interface Alert {
  level: 'warning' | 'error';
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

export function PerformanceMonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh health data every 30 seconds
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/contractors/health');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setHealthData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();

    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchHealthData, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warn':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'fail':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
      case 'warn':
        return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy':
      case 'fail':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds >= 1000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
    return `${milliseconds.toFixed(0)}ms`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading performance data: {error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center p-8 text-gray-500">
        No performance data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">System Health</h3>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
            {getStatusIcon(healthData.status)}
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

      {/* Health Checks */}
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
                  {getStatusIcon(check.status)}
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

      {/* Performance Metrics */}
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

      {/* Alerts */}
      {healthData.alerts.length > 0 && (
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
      )}
    </div>
  );
}