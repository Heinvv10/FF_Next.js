/**
 * AnalyticsHeader Component
 * Header with title, description, date range selector, and refresh button
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DateRange } from '../types/analytics.types';

interface AnalyticsHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
}

export function AnalyticsHeader({ dateRange, onDateRangeChange, onRefresh }: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Workflow Analytics
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Performance metrics and insights for project workflows
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>

        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
