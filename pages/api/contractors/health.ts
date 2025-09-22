/**
 * Contractors Health Check API
 * GET /api/contractors/health - Get system health status and performance metrics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { contractorPerformanceMonitor } from '@/services/contractor/monitoring/performanceMonitor';
import { log } from '@/lib/logger';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    message?: string;
    metadata?: Record<string, any>;
  }>;
  performance: {
    operations: {
      totalOperations: number;
      averageResponseTime: number;
      successRate: number;
      slowOperations: number;
      topSlowOperations: Array<{
        operation: string;
        avgDuration: number;
        count: number;
      }>;
    };
    queries: {
      totalQueries: number;
      averageQueryTime: number;
      slowQueries: number;
      topSlowQueries: Array<{
        query: string;
        avgDuration: number;
        count: number;
      }>;
    };
  };
  alerts: Array<{
    level: 'warning' | 'error';
    message: string;
    details: Record<string, any>;
    timestamp: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Perform health check
    const healthStatus = await contractorPerformanceMonitor.performHealthCheck();
    
    // Get performance metrics
    const operationMetrics = contractorPerformanceMonitor.getMetricsSummary();
    const queryMetrics = contractorPerformanceMonitor.getQueryMetricsSummary();
    
    // Get performance alerts
    const alerts = contractorPerformanceMonitor.getPerformanceAlerts();

    const response: HealthResponse = {
      status: healthStatus.status,
      timestamp: healthStatus.timestamp.toISOString(),
      uptime: healthStatus.uptime,
      checks: healthStatus.checks,
      performance: {
        operations: operationMetrics,
        queries: queryMetrics
      },
      alerts: alerts.map(alert => ({
        ...alert,
        timestamp: alert.timestamp.toISOString()
      }))
    };

    // Set appropriate HTTP status based on health
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    // Add cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Add health check headers for load balancers
    res.setHeader('X-Health-Status', healthStatus.status);
    res.setHeader('X-Response-Time', Date.now().toString());

    return res.status(httpStatus).json(response);
  } catch (error) {
    log.error('Health check failed:', { data: error }, 'api/contractors/health');
    
    return res.status(500).json({ 
      error: 'Health check failed',
    });
  }
}