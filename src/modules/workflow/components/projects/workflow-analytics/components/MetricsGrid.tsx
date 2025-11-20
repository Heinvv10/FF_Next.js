/**
 * MetricsGrid Component
 * Grid of key performance metrics
 */

import React from 'react';
import { Calendar, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { WorkflowAnalytics } from '../../../types/workflow.types';

interface MetricsGridProps {
  performanceMetrics: WorkflowAnalytics['performanceMetrics'];
  templateCount: number;
}

export function MetricsGrid({ performanceMetrics, templateCount }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Projects"
        value={performanceMetrics.totalProjects}
        subtitle="Active workflows"
        icon={<Calendar className="w-6 h-6" />}
        color="blue"
        trend={{ direction: 'up', percentage: 12 }}
      />

      <MetricCard
        title="Avg Duration"
        value={`${Math.round(performanceMetrics.averageProjectDuration)} days`}
        subtitle="Project completion time"
        icon={<Clock className="w-6 h-6" />}
        color="green"
        trend={{ direction: 'down', percentage: 8 }}
      />

      <MetricCard
        title="On-Time Rate"
        value={`${Math.round(performanceMetrics.onTimeCompletion)}%`}
        subtitle="Projects completed on schedule"
        icon={<CheckCircle2 className="w-6 h-6" />}
        color="yellow"
        trend={{ direction: 'up', percentage: 5 }}
      />

      <MetricCard
        title="Template Usage"
        value={templateCount}
        subtitle="Active templates"
        icon={<BarChart3 className="w-6 h-6" />}
        color="purple"
      />
    </div>
  );
}
