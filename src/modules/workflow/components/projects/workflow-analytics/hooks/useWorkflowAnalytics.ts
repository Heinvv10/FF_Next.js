/**
 * useWorkflowAnalytics Hook
 * Manages data fetching and state for workflow analytics
 */

import { useState, useEffect } from 'react';
import type { WorkflowAnalytics as WorkflowAnalyticsData } from '../../../types/workflow.types';
import { workflowTemplateService } from '../../../services/WorkflowTemplateService';
import { log } from '@/lib/logger';
import { DateRange } from '../types/analytics.types';
import { calculateDateRange } from '../utils/dateRangeCalculator';

interface UseWorkflowAnalyticsReturn {
  analyticsData: WorkflowAnalyticsData | null;
  loading: boolean;
  error: string | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  loadAnalytics: () => Promise<void>;
}

export function useWorkflowAnalytics(): UseWorkflowAnalyticsReturn {
  const [analyticsData, setAnalyticsData] = useState<WorkflowAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = calculateDateRange(dateRange);

      const data = await workflowTemplateService.getTemplateAnalytics(
        startDate.toISOString(),
        endDate.toISOString()
      );

      setAnalyticsData(data);
    } catch (err) {
      setError('Failed to load analytics data');
      log.error('Analytics loading error:', { data: err }, 'WorkflowAnalytics');
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    loading,
    error,
    dateRange,
    setDateRange,
    loadAnalytics,
  };
}
