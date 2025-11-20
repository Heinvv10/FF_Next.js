/**
 * Monitoring Dashboard
 * Story 3.5: Monitoring Dashboard & Alerts
 *
 * Real-time system health monitoring
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 425 → ~60 lines (86% reduction)
 */

import React from 'react';
import { AppLayout } from '@/components/layout';
import { useMonitoringData } from './monitoring/hooks/useMonitoringData';
import {
  MonitoringHeader,
  SystemHealthCard,
  WebVitalsCard,
  ErrorTrackingCard,
  PerformanceMetricsGrid,
  DatabasePerformanceCard,
  RateLimitingCard,
  PerformanceBudgetCard,
} from './monitoring/components';

/**
 * MonitoringDashboard - Main orchestrator component
 *
 * Architecture:
 * - hooks/useMonitoringData.ts: Data fetching & state management
 * - components/: 8 modular UI cards
 * - types/: TypeScript definitions
 * - data/: Configuration & mock data
 * - utils/: Helper functions
 */
export default function MonitoringDashboard() {
  const { webVitals, errors, systemHealth } = useMonitoringData();

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <MonitoringHeader lastCheck={systemHealth.lastCheck} />
        <SystemHealthCard systemHealth={systemHealth} />
        <WebVitalsCard webVitals={webVitals} />
        <ErrorTrackingCard errors={errors} />
        <PerformanceMetricsGrid />
        <DatabasePerformanceCard />
        <RateLimitingCard />
        <PerformanceBudgetCard />
      </div>
    </AppLayout>
  );
}
