/**
 * Performance Monitoring Hook
 * Business logic for performance monitoring dashboard
 * @module PerformanceMonitoring
 */

import { useState, useEffect, useCallback } from 'react';

export interface HealthStatus {
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

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface OperationMetrics {
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

export interface QueryMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  topSlowQueries: Array<{
    query: string;
    avgDuration: number;
    count: number;
  }>;
}

export interface Alert {
  level: 'warning' | 'error';
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

interface UsePerformanceMonitoringReturn {
  // State
  healthData: HealthStatus | null;
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;

  // Actions
  setAutoRefresh: (enabled: boolean) => void;
  fetchHealthData: () => Promise<void>;
  clearError: () => void;

  // Utilities
  formatUptime: (milliseconds: number) => string;
  formatDuration: (milliseconds: number) => string;
  formatPercentage: (value: number) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export function usePerformanceMonitoring(): UsePerformanceMonitoringReturn {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch health data from API
   */
  const fetchHealthData = useCallback(async () => {
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
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get status color classes
   */
  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  /**
   * Get status icon component
   */
  const getStatusIcon = useCallback((status: string) => {
    // This would need to be imported in the component using the hook
    // For now, returning a string representation
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'check-circle';
      case 'degraded':
      case 'warn':
        return 'alert-triangle';
      case 'unhealthy':
      case 'fail':
        return 'alert-triangle';
      default:
        return 'activity';
    }
  }, []);

  /**
   * Format uptime into human readable format
   */
  const formatUptime = useCallback((milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, []);

  /**
   * Format duration into readable string
   */
  const formatDuration = useCallback((milliseconds: number) => {
    if (milliseconds >= 1000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
    return `${milliseconds.toFixed(0)}ms`;
  }, []);

  /**
   * Format decimal as percentage
   */
  const formatPercentage = useCallback((value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  // Auto-refresh health data every 30 seconds
  useEffect(() => {
    fetchHealthData();

    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchHealthData, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchHealthData, autoRefresh]);

  return {
    // State
    healthData,
    isLoading,
    error,
    autoRefresh,

    // Actions
    setAutoRefresh,
    fetchHealthData,
    clearError,

    // Utilities
    formatUptime,
    formatDuration,
    formatPercentage,
    getStatusColor,
    getStatusIcon
  };
}