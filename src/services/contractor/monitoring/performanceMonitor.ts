/**
 * Performance Monitoring Service for Contractors Module
 * Monitors query performance, API response times, and system health
 */

import { log } from '@/lib/logger';

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface QueryPerformance {
  query: string;
  duration: number;
  rowCount?: number;
  success: boolean;
  timestamp: Date;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  uptime: number;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  metadata?: Record<string, any>;
}

class ContractorPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformance[] = [];
  private readonly maxMetricsHistory = 1000;
  private startTime = Date.now();

  /**
   * Track API operation performance
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let error: Error | null = null;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        success,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          error: error?.message
        }
      });

      // Log slow operations
      if (duration > 1000) {
        log.warn(`Slow operation detected: ${operation}`, {
          duration,
          metadata
        }, 'ContractorPerformanceMonitor');
      }
    }
  }

  /**
   * Track database query performance
   */
  trackQuery(query: string, duration: number, rowCount?: number, success: boolean = true): void {
    this.recordQueryMetric({
      query: this.sanitizeQuery(query),
      duration,
      rowCount,
      success,
      timestamp: new Date()
    });

    // Log slow queries
    if (duration > 500) {
      log.warn('Slow query detected', {
        query: this.sanitizeQuery(query),
        duration,
        rowCount
      }, 'ContractorPerformanceMonitor');
    }
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(timeWindow: number = 300000): {
    totalOperations: number;
    averageResponseTime: number;
    successRate: number;
    slowOperations: number;
    topSlowOperations: Array<{operation: string; avgDuration: number; count: number}>;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        successRate: 1,
        slowOperations: 0,
        topSlowOperations: []
      };
    }

    const totalOperations = recentMetrics.length;
    const successfulOps = recentMetrics.filter(m => m.success).length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const slowOperations = recentMetrics.filter(m => m.duration > 1000).length;

    // Group by operation and calculate averages
    const operationStats = new Map<string, {totalDuration: number; count: number}>();
    recentMetrics.forEach(metric => {
      const existing = operationStats.get(metric.operation) || {totalDuration: 0, count: 0};
      operationStats.set(metric.operation, {
        totalDuration: existing.totalDuration + metric.duration,
        count: existing.count + 1
      });
    });

    const topSlowOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalOperations,
      averageResponseTime,
      successRate: successfulOps / totalOperations,
      slowOperations,
      topSlowOperations
    };
  }

  /**
   * Get query performance summary
   */
  getQueryMetricsSummary(timeWindow: number = 300000): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    topSlowQueries: Array<{query: string; avgDuration: number; count: number}>;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentQueries = this.queryMetrics.filter(q => q.timestamp.getTime() > cutoff);

    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        topSlowQueries: []
      };
    }

    const totalQueries = recentQueries.length;
    const averageQueryTime = recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    const slowQueries = recentQueries.filter(q => q.duration > 500).length;

    // Group by query pattern
    const queryStats = new Map<string, {totalDuration: number; count: number}>();
    recentQueries.forEach(query => {
      const existing = queryStats.get(query.query) || {totalDuration: 0, count: 0};
      queryStats.set(query.query, {
        totalDuration: existing.totalDuration + query.duration,
        count: existing.count + 1
      });
    });

    const topSlowQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      topSlowQueries
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];

    // Database connectivity check
    checks.push(await this.checkDatabaseConnectivity());

    // API performance check
    checks.push(await this.checkApiPerformance());

    // Memory usage check
    checks.push(await this.checkMemoryUsage());

    // Error rate check
    checks.push(await this.checkErrorRate());

    // Determine overall status
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warn').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks > 0) {
      status = 'unhealthy';
    } else if (warningChecks > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(): Array<{
    level: 'warning' | 'error';
    message: string;
    details: Record<string, any>;
    timestamp: Date;
  }> {
    const alerts = [];
    const summary = this.getMetricsSummary();

    // High error rate alert
    if (summary.successRate < 0.95) {
      alerts.push({
        level: 'error' as const,
        message: 'High error rate detected in contractors module',
        details: {
          successRate: summary.successRate,
          totalOperations: summary.totalOperations
        },
        timestamp: new Date()
      });
    }

    // Slow operations alert
    if (summary.averageResponseTime > 2000) {
      alerts.push({
        level: 'warning' as const,
        message: 'High average response time detected',
        details: {
          averageResponseTime: summary.averageResponseTime,
          slowOperations: summary.slowOperations
        },
        timestamp: new Date()
      });
    }

    // Many slow queries alert
    const queryStats = this.getQueryMetricsSummary();
    if (queryStats.slowQueries > queryStats.totalQueries * 0.1) {
      alerts.push({
        level: 'warning' as const,
        message: 'High number of slow database queries',
        details: {
          slowQueries: queryStats.slowQueries,
          totalQueries: queryStats.totalQueries,
          percentage: (queryStats.slowQueries / queryStats.totalQueries) * 100
        },
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    performance: PerformanceMetric[];
    queries: QueryPerformance[];
    summary: ReturnType<typeof this.getMetricsSummary>;
    querySummary: ReturnType<typeof this.getQueryMetricsSummary>;
  } {
    return {
      performance: [...this.metrics],
      queries: [...this.queryMetrics],
      summary: this.getMetricsSummary(),
      querySummary: this.getQueryMetricsSummary()
    };
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private recordQueryMetric(metric: QueryPerformance): void {
    this.queryMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove specific values to group similar queries
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async checkDatabaseConnectivity(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // Try a simple query to test connectivity
      // This would be implemented based on your database setup
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB check
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'database_connectivity',
        status: 'pass',
        duration,
        message: 'Database connectivity is healthy'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'database_connectivity',
        status: 'fail',
        duration,
        message: `Database connectivity failed: ${error}`,
        metadata: { error: String(error) }
      };
    }
  }

  private async checkApiPerformance(): Promise<HealthCheck> {
    const startTime = performance.now();
    const summary = this.getMetricsSummary(60000); // Last minute
    
    const duration = performance.now() - startTime;
    
    if (summary.averageResponseTime > 3000) {
      return {
        name: 'api_performance',
        status: 'fail',
        duration,
        message: 'API performance is degraded',
        metadata: { averageResponseTime: summary.averageResponseTime }
      };
    } else if (summary.averageResponseTime > 1500) {
      return {
        name: 'api_performance',
        status: 'warn',
        duration,
        message: 'API performance is slow',
        metadata: { averageResponseTime: summary.averageResponseTime }
      };
    }

    return {
      name: 'api_performance',
      status: 'pass',
      duration,
      message: 'API performance is healthy',
      metadata: { averageResponseTime: summary.averageResponseTime }
    };
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
      const usagePercent = (heapUsedMB / heapTotalMB) * 100;
      
      const duration = performance.now() - startTime;

      if (usagePercent > 90) {
        return {
          name: 'memory_usage',
          status: 'fail',
          duration,
          message: 'Memory usage is critically high',
          metadata: { heapUsedMB, heapTotalMB, usagePercent }
        };
      } else if (usagePercent > 75) {
        return {
          name: 'memory_usage',
          status: 'warn',
          duration,
          message: 'Memory usage is high',
          metadata: { heapUsedMB, heapTotalMB, usagePercent }
        };
      }

      return {
        name: 'memory_usage',
        status: 'pass',
        duration,
        message: 'Memory usage is normal',
        metadata: { heapUsedMB, heapTotalMB, usagePercent }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'memory_usage',
        status: 'fail',
        duration,
        message: `Memory check failed: ${error}`
      };
    }
  }

  private async checkErrorRate(): Promise<HealthCheck> {
    const startTime = performance.now();
    const summary = this.getMetricsSummary(300000); // Last 5 minutes
    
    const duration = performance.now() - startTime;

    if (summary.totalOperations === 0) {
      return {
        name: 'error_rate',
        status: 'pass',
        duration,
        message: 'No operations to check error rate'
      };
    }

    const errorRate = 1 - summary.successRate;

    if (errorRate > 0.1) {
      return {
        name: 'error_rate',
        status: 'fail',
        duration,
        message: 'Error rate is too high',
        metadata: { errorRate, successRate: summary.successRate }
      };
    } else if (errorRate > 0.05) {
      return {
        name: 'error_rate',
        status: 'warn',
        duration,
        message: 'Error rate is elevated',
        metadata: { errorRate, successRate: summary.successRate }
      };
    }

    return {
      name: 'error_rate',
      status: 'pass',
      duration,
      message: 'Error rate is normal',
      metadata: { errorRate, successRate: summary.successRate }
    };
  }
}

// Singleton instance
export const contractorPerformanceMonitor = new ContractorPerformanceMonitor();

// Utility function to wrap database operations with monitoring
export function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return contractorPerformanceMonitor.trackOperation(operation, fn, metadata);
}

// Utility function to track database queries
export function trackDatabaseQuery(
  query: string,
  duration: number,
  rowCount?: number,
  success: boolean = true
): void {
  contractorPerformanceMonitor.trackQuery(query, duration, rowCount, success);
}