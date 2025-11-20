/**
 * MetricCard Component
 * Displays a single metric with icon, trend, and styling
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { MetricCardProps } from '../types/analytics.types';
import { METRIC_COLOR_CLASSES } from '../data/colorSchemes';

export function MetricCard({ title, value, subtitle, icon, trend, color }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${METRIC_COLOR_CLASSES[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-3">
          <TrendingUp className={`w-4 h-4 mr-1 ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`} />
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.percentage}%
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
}
