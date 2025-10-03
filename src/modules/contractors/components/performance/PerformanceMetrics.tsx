/**
 * PerformanceMetrics - Key performance indicators display
 */

import React from 'react';
import { TrendingUp, Award, Shield, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import { PerformanceMetrics } from './PerformanceTypes';

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const metricCards = [
    {
      title: 'Overall Performance',
      value: `${metrics.overallPerformance.toFixed(1)}%`,
      icon: TrendingUp,
      color: getScoreColor(metrics.overallPerformance),
      bgColor: getScoreBgColor(metrics.overallPerformance),
      description: 'Average performance score across all contractors',
    },
    {
      title: 'Quality Score',
      value: `${metrics.qualityScore.toFixed(1)}%`,
      icon: Award,
      color: getScoreColor(metrics.qualityScore),
      bgColor: getScoreBgColor(metrics.qualityScore),
      description: 'Work quality assessment',
    },
    {
      title: 'Safety Score',
      value: `${metrics.safetyScore.toFixed(1)}%`,
      icon: Shield,
      color: getScoreColor(metrics.safetyScore),
      bgColor: getScoreBgColor(metrics.safetyScore),
      description: 'Safety compliance rating',
    },
    {
      title: 'On-Time Delivery',
      value: `${metrics.timelinessScore.toFixed(1)}%`,
      icon: Clock,
      color: getScoreColor(metrics.timelinessScore),
      bgColor: getScoreBgColor(metrics.timelinessScore),
      description: 'Schedule adherence',
    },
    {
      title: 'Project Completion',
      value: `${metrics.projectCompletionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: getScoreColor(metrics.projectCompletionRate),
      bgColor: getScoreBgColor(metrics.projectCompletionRate),
      description: 'Projects successfully completed',
    },
    {
      title: 'Active Contractors',
      value: metrics.contractorCount.toString(),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Total contractors in system',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${metric.bgColor} rounded-lg p-3`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm font-medium text-gray-600">{metric.title}</div>
                <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}