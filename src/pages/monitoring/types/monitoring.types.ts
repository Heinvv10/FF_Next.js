/**
 * Type definitions for the Monitoring Dashboard
 * Extracted from monitoring.tsx
 */

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
}

export interface ErrorEvent {
  message: string;
  severity: string;
  timestamp: string;
  count: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  lastCheck: string;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  isPositive: boolean;
}

export interface DatabaseMetric {
  label: string;
  value: string;
  description: string;
  status: 'good' | 'warning' | 'error';
}

export interface RateLimitMetric {
  label: string;
  description: string;
  value: number;
}

export interface PerformanceBudgetItem {
  metric: string;
  current: string;
  budget: string;
  status: 'pass' | 'fail';
}

export type StatusRating = 'healthy' | 'degraded' | 'critical' | 'good' | 'needs-improvement' | 'poor';
