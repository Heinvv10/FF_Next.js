/**
 * Monitoring Dashboard Types
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
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface DatabaseMetric {
  label: string;
  value: string;
  status: string;
  statusType: 'success' | 'warning' | 'error';
}

export interface PerformanceBudgetItem {
  metric: string;
  current: string;
  budget: string;
  status: 'pass' | 'fail';
}
