/**
 * Color Schemes for Analytics Components
 * Tailwind CSS classes for consistent theming
 */

import { MetricColor } from '../types/analytics.types';

export const METRIC_COLOR_CLASSES: Record<MetricColor, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
};

export const CHART_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-gray-500',
] as const;
