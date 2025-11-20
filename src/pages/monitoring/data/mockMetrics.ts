/**
 * Mock Metrics Data
 * Static data for performance metrics dashboard cards
 */

import {
  PerformanceMetric,
  DatabaseMetric,
  RateLimitMetric,
} from '../types/monitoring.types';

export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    label: 'Avg Response Time',
    value: '234ms',
    trend: '↓ 45% faster',
    trendDirection: 'down',
    isPositive: true,
  },
  {
    label: 'Cache Hit Rate',
    value: '73.2%',
    trend: '↑ Target: >70%',
    trendDirection: 'up',
    isPositive: true,
  },
  {
    label: 'Error Rate',
    value: '0.08%',
    trend: '✓ Target: <0.1%',
    trendDirection: 'neutral',
    isPositive: true,
  },
  {
    label: 'Active Users',
    value: '1,247',
    trend: '↑ 12% vs yesterday',
    trendDirection: 'up',
    isPositive: true,
  },
];

export const DATABASE_METRICS: DatabaseMetric[] = [
  {
    label: 'Avg Query Time',
    value: '42ms',
    description: '↓ 80% faster',
    status: 'good',
  },
  {
    label: 'Slow Queries',
    value: '3',
    description: '>100ms threshold',
    status: 'warning',
  },
  {
    label: 'N+1 Queries',
    value: '0',
    description: '✓ No issues detected',
    status: 'good',
  },
];

export const RATE_LIMIT_METRICS: RateLimitMetric[] = [
  {
    label: 'API Requests Blocked',
    description: 'Last 24 hours',
    value: 127,
  },
  {
    label: 'Active Rate Limit Entries',
    description: 'Current',
    value: 2453,
  },
];
