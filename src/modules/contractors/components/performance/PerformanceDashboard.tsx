/**
 * Performance Dashboard Component - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 426 lines to <200 lines by using hooks and sub-components
 * @module PerformanceDashboard
 */

import React from 'react';
import { PerformanceDashboardProps } from './types';
import { usePerformanceDashboard } from '../../hooks/usePerformanceDashboard';
import { PerformanceStates } from './components/PerformanceStates';
import { PerformanceHeader } from './components/PerformanceHeader';
import { PerformanceOverview } from './components/PerformanceOverview';
import { PerformanceMainContent } from './components/PerformanceMainContent';

/**
 * Performance Dashboard Component - Refactored (Main orchestrator)
 */
export function PerformanceDashboard(props: PerformanceDashboardProps) {
  // Use custom hook for business logic
  const hookState = usePerformanceDashboard(props);

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    showFiltersPanel,
    loadPerformanceData,
    handleContractorSelect,
    clearError,
    config
  } = hookState;

  // Handle states (loading, error, empty)
  const stateComponent = (
    <PerformanceStates
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={() => loadPerformanceData()}
    />
  );

  // If showing a state component, return it
  if ((isLoading && !data) || (error && !data) || !data) {
    return stateComponent;
  }

  // Main render - delegating to specialized components
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <PerformanceHeader
        isRefreshing={isRefreshing}
        showFilters={props.showFilters ?? true}
        showFiltersPanel={showFiltersPanel}
        lastRefresh={lastRefresh}
        onRefresh={() => loadPerformanceData(true)}
        onToggleFilters={() => hookState.setShowFiltersPanel(!showFiltersPanel)}
      />

      {/* Overview Statistics */}
      <PerformanceOverview data={data} />

      {/* Main Dashboard Content */}
      <PerformanceMainContent
        data={data}
        config={config}
        onContractorSelect={handleContractorSelect}
      />
    </div>
  );
}