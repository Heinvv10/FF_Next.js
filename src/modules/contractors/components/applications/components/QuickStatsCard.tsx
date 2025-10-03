/**
 * Quick Stats Card Component
 * Displays a single metric with icon and optional trend
 * @module PendingApplicationsList
 */

import React from 'react';
import { QuickStatsCardProps } from '../types/pendingApplicationsList.types';

export function QuickStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = ''
}: QuickStatsCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className={`p-3 rounded-lg ${
            trend?.direction === 'up' ? 'bg-green-50' :
            trend?.direction === 'down' ? 'bg-red-50' :
            'bg-gray-50'
          }`}>
            <Icon className={`w-6 h-6 ${
              trend?.direction === 'up' ? 'text-green-600' :
              trend?.direction === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`} />
          </div>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
          {trend.direction === 'up' ? (
            <span className="text-green-600 font-medium">+{trend.value}%</span>
          ) : (
            <span className="text-red-600 font-medium">-{trend.value}%</span>
          )}
          <span className="text-gray-500 ml-2">from last week</span>
        </div>
      )}
    </div>
  );
}