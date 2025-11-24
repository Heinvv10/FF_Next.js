/**
 * useWorkflowAnalytics Hook
 * Manages analytics data fetching and state
 */

import { useState, useEffect } from 'react';
import type { WorkflowAnalytics as WorkflowAnalyticsData } from '../../../../types/workflow.types';
import { workflowTemplateService } from '../../../../services/WorkflowTemplateService';
import { log } from '@/lib/logger';
import type { DateRange } from '../types/analytics.types';

export function useWorkflowAnalytics(dateRange: DateRange) {
  const [analyticsData, setAnalyticsData] = useState<WorkflowAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

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
    loadAnalytics
  };
}
