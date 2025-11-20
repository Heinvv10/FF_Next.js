/**
 * Monitoring Helper Functions
 * Utility functions for formatting and styling monitoring data
 */

import { StatusRating } from '../types/monitoring.types';

/**
 * Get Tailwind color classes based on status rating
 */
export function getStatusColor(status: StatusRating | string): string {
  switch (status) {
    case 'healthy':
    case 'good':
      return 'text-green-600 bg-green-50';
    case 'degraded':
    case 'needs-improvement':
      return 'text-yellow-600 bg-yellow-50';
    case 'critical':
    case 'poor':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Format metric value with appropriate units
 * CLS is shown as decimal, others as ms or s
 */
export function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
}

/**
 * Get severity badge color classes
 */
export function getSeverityColor(severity: string): string {
  if (severity === 'fatal' || severity === 'error') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-yellow-100 text-yellow-700';
}

/**
 * Get database metric status color
 */
export function getDatabaseStatusColor(status: 'good' | 'warning' | 'error'): string {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
