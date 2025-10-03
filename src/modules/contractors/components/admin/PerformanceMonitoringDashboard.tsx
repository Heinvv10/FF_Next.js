/**
 * Performance Monitoring Dashboard - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 413 lines to <200 lines by using hooks and sub-components
 * @module PerformanceMonitoring
 */

import React from 'react';
import { usePerformanceMonitoring } from '../../../hooks/usePerformanceMonitoring';
import { MonitoringStates } from './components/MonitoringStates';
import { MonitoringHeader } from './components/MonitoringHeader';
import { SystemHealthCard } from './components/SystemHealthCard';
import { HealthChecksList } from './components/HealthChecksList';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { AlertsList } from './components/AlertsList';

/**
 * Performance Monitoring Dashboard Component - Refactored (Main orchestrator)
 */
export function PerformanceMonitoringDashboard() {
  // Use custom hook for business logic
  const hookState = usePerformanceMonitoring();

  const {
    healthData,
    isLoading,
    error,
    autoRefresh,
    setAutoRefresh,
    fetchHealthData,
    clearError,
    formatUptime,
    formatDuration,
    formatPercentage,
    getStatusColor,
    getStatusIcon
  } = hookState;

  // Handle states (loading, error, empty)
  const stateComponent = (
    <MonitoringStates
      isLoading={isLoading}
      error={error}
      healthData={healthData}
      onRetry={fetchHealthData}
    />
  );

  // If showing a state component, return it
  if ((isLoading && !healthData) || (error && !healthData) || !healthData) {
    return stateComponent;
  }

  // Main render - delegating to specialized components
  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <MonitoringHeader
        healthData={healthData}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
      />

      {/* System Health Overview */}
      <SystemHealthCard
        healthData={healthData}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        formatUptime={formatUptime}
      />

      {/* Health Checks List */}
      <HealthChecksList
        healthData={healthData}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        formatDuration={formatDuration}
      />

      {/* Performance Metrics */}
      <PerformanceMetrics
        healthData={healthData}
        formatDuration={formatDuration}
        formatPercentage={formatPercentage}
      />

      {/* Alerts List */}
      <AlertsList healthData={healthData} />
    </div>
  );
}