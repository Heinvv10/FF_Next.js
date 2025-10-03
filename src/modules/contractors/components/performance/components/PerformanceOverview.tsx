/**
 * Performance Overview Component
 * Overview statistics cards for performance dashboard
 * @module PerformanceDashboard
 */

import React from 'react';
import { Users, Award, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { PerformanceDashboardData } from '../types';

interface PerformanceOverviewProps {
  data: PerformanceDashboardData;
}

export function PerformanceOverview({ data }: PerformanceOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Contractors</p>
            <p className="text-3xl font-bold text-gray-900">{data.overview.totalContractors}</p>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average RAG Score</p>
            <p className="text-3xl font-bold text-gray-900">{data.overview.averageRAGScore}</p>
          </div>
          <Target className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Top Performers</p>
            <p className="text-3xl font-bold text-gray-900">{data.overview.performanceDistribution.excellent}</p>
          </div>
          <Award className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Performance Trend</p>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {data.trends.averageImprovement > 0 ? '+' : ''}{data.trends.averageImprovement.toFixed(1)}%
              </span>
              {data.trends.trendsDirection === 'up' ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : data.trends.trendsDirection === 'down' ? (
                <TrendingDown className="w-6 h-6 text-red-600" />
              ) : (
                <div className="w-6 h-6" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}