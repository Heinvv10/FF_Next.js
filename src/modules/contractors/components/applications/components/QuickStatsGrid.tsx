/**
 * Quick Stats Grid Component
 * Grid of statistics cards for pending applications
 * @module PendingApplicationsList
 */

import React from 'react';
import { Users, Clock, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import { QuickStatsGridProps } from '../types/pendingApplicationsList.types';
import { QuickStatsCard } from './QuickStatsCard';

export function QuickStatsGrid({ stats, className = '' }: QuickStatsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
      <QuickStatsCard
        title="Total Applications"
        value={stats.total}
        icon={Users}
        trend={{ value: 12, direction: 'up' }}
      />

      <QuickStatsCard
        title="Pending Review"
        value={stats.pending}
        subtitle={`${Math.round((stats.pending / stats.total) * 100)}% of total`}
        icon={Clock}
        trend={{ value: 8, direction: 'down' }}
      />

      <QuickStatsCard
        title="Under Review"
        value={stats.underReview}
        subtitle="In progress"
        icon={FileText}
      />

      <QuickStatsCard
        title="Incomplete Docs"
        value={stats.documentIncomplete}
        subtitle="Need attention"
        icon={AlertCircle}
        trend={{ value: 3, direction: 'up' }}
      />

      <QuickStatsCard
        title="Avg. Processing"
        value={`${Math.round(stats.averageProcessingDays)} days`}
        icon={TrendingUp}
        trend={{ value: 15, direction: 'down' }}
      />
    </div>
  );
}