/**
 * Workflow Analytics Dashboard
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 399 → ~80 lines (80% reduction)
 *
 * Architecture:
 * - hooks/: Data fetching and state management
 * - components/: 9 reusable UI components
 * - types/: TypeScript definitions
 * - utils/: Helper functions
 * - data/: Color schemes and constants
 */

import React from 'react';
import { useWorkflowAnalytics } from './workflow-analytics/hooks/useWorkflowAnalytics';
import {
  LoadingState,
  ErrorState,
  AnalyticsHeader,
  MetricsGrid,
  TemplateUsageChart,
  PhasePerformanceCard,
  BottlenecksCard,
  SuccessFactorsCard,
} from './workflow-analytics/components';

/**
 * WorkflowAnalytics - Main orchestrator component
 *
 * Displays comprehensive analytics for workflow performance including:
 * - Key performance metrics
 * - Template usage statistics
 * - Phase-level performance
 * - Common bottlenecks
 * - Success factors
 */
export function WorkflowAnalytics() {
  const {
    analyticsData,
    loading,
    error,
    dateRange,
    setDateRange,
    loadAnalytics,
  } = useWorkflowAnalytics();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !analyticsData) {
    return <ErrorState error={error || 'Unable to load workflow analytics data'} onRetry={loadAnalytics} />;
  }

  const { performanceMetrics, templateUsage, phaseMetrics } = analyticsData;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <AnalyticsHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={loadAnalytics}
        />

        <MetricsGrid
          performanceMetrics={performanceMetrics}
          templateCount={templateUsage.length}
        />

        <TemplateUsageChart templateUsage={templateUsage} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PhasePerformanceCard phaseMetrics={phaseMetrics} />
          <BottlenecksCard bottlenecks={performanceMetrics.commonBottlenecks} />
        </div>

        <SuccessFactorsCard />
      </div>
    </div>
  );
}
