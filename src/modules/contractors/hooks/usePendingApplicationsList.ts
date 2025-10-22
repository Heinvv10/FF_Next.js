/**
 * Pending Applications List Hook
 * Business logic for pending applications management
 * @module PendingApplicationsList
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ApplicationFilters as IApplicationFilters, ApplicationSummary, ApplicationStatus } from '@/types/contractor.types';
import { contractorApiService } from '@/services/contractor/contractorApiService';
import { log } from '@/lib/logger';
import { PendingApplicationsListProps, PendingApplicationsListState, PendingApplicationsListActions, QuickStats } from '../components/applications/types/pendingApplicationsList.types';

export function usePendingApplicationsList(props: PendingApplicationsListProps) {
  const { initialFilter, pageSize = 50 } = props;
  const router = useRouter();

  // Component state
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<IApplicationFilters>({
    status: ['pending', 'under_review', 'documentation_incomplete'],
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: pageSize,
    ...initialFilter
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    total: 0,
    pending: 0,
    underReview: 0,
    documentIncomplete: 0,
    averageProcessingDays: 0
  });

  // Helper function to calculate days since a date
  const getDaysSince = useCallback((date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }, []);

  // Load applications data
  const loadApplications = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const response = await contractorApiService.getAll();

      // Handle empty or invalid responses
      const contractors = Array.isArray(response) ? response : [];

      if (contractors.length === 0) {
        setApplications([]);
        setQuickStats({
          total: 0,
          pending: 0,
          underReview: 0,
          documentIncomplete: 0,
          averageProcessingDays: 0
        });
        return;
      }

      // Transform contractor data to application summary format
      const applicationSummaries: ApplicationSummary[] = contractors.map((contractor: any) => ({
        id: contractor.id,
        companyName: contractor.companyName,
        contactPerson: contractor.contactPerson,
        email: contractor.email,
        phone: contractor.phone,
        status: contractor.status as ApplicationStatus,
        applicationDate: contractor.createdAt,
        lastActivity: contractor.updatedAt,
        progress: contractor.onboardingProgress || 0,
        documentsComplete: contractor.documentsExpiring === 0 && contractor.onboardingProgress > 80,
        ragOverall: contractor.ragOverall,
        urgentFlags: [
          ...(contractor.documentsExpiring > 0 ? ['Docs Expiring'] : []),
          ...(contractor.onboardingProgress < 50 && getDaysSince(contractor.createdAt) > 7 ? ['Delayed'] : []),
          ...(contractor.ragOverall === 'red' ? ['High Risk'] : [])
        ],
        daysInReview: getDaysSince(contractor.createdAt),
        nextAction: contractor.onboardingProgress < 100 ? 'Complete onboarding' : 'Review application'
      }));

      setApplications(applicationSummaries);

      // DEBUG: Log application statuses
      log.info('🔍 DEBUG - Application statuses:', { data: {
        totalApplications: applicationSummaries.length,
        statusBreakdown: applicationSummaries.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sampleStatuses: applicationSummaries.slice(0, 3).map(app => ({
          company: app.companyName,
          status: app.status,
          statusType: typeof app.status,
          statusLength: app.status?.length
        }))
      } }, 'PendingApplicationsList');

      // Calculate quick stats
      const stats: QuickStats = {
        total: applicationSummaries.length,
        pending: applicationSummaries.filter(app => app.status === 'pending').length,
        underReview: applicationSummaries.filter(app => app.status === 'under_review').length,
        documentIncomplete: applicationSummaries.filter(app => app.status === 'documentation_incomplete').length,
        averageProcessingDays: applicationSummaries.reduce((sum, app) => sum + app.daysInReview, 0) / applicationSummaries.length || 0
      };

      log.info('📊 DEBUG - Calculated stats:', { data: stats }, 'PendingApplicationsList');
      setQuickStats(stats);

    } catch (err) {
      log.error('Failed to load applications:', { data: err }, 'PendingApplicationsList');
      setError('Failed to load applications. Please try again.');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, getDaysSince]);

  // Initialize data loading
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Handle application selection
  const handleApplicationSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  // Handle select all applications
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = applications.map(app => app.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }, [applications]);

  // Handle bulk approve action
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      // TODO: Implement bulk approval API call
      log.info('Bulk approving applications:', { data: selectedIds }, 'PendingApplicationsList');

      // For now, just update the local state
      setApplications(prev => prev.map(app =>
        selectedIds.includes(app.id)
          ? { ...app, status: 'approved' as ApplicationStatus }
          : app
      ));

      setSelectedIds([]);
    } catch (err) {
      log.error('Bulk approval failed:', { data: err }, 'PendingApplicationsList');
      setError('Bulk approval failed. Please try again.');
    }
  }, [selectedIds]);

  // Handle bulk reject action
  const handleBulkReject = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      // TODO: Implement bulk rejection API call
      log.info('Bulk rejecting applications:', { data: selectedIds }, 'PendingApplicationsList');

      // For now, just update the local state
      setApplications(prev => prev.map(app =>
        selectedIds.includes(app.id)
          ? { ...app, status: 'rejected' as ApplicationStatus }
          : app
      ));

      setSelectedIds([]);
    } catch (err) {
      log.error('Bulk rejection failed:', { data: err }, 'PendingApplicationsList');
      setError('Bulk rejection failed. Please try again.');
    }
  }, [selectedIds]);

  // Handle export functionality
  const handleExport = useCallback(() => {
    // TODO: Implement actual export functionality
    log.info('Exporting applications data', {}, 'PendingApplicationsList');

    // Create CSV content
    const headers = ['Company', 'Contact', 'Email', 'Status', 'Progress', 'Days in Review'];
    const rows = applications.map(app => [
      app.companyName,
      app.contactPerson,
      app.email,
      app.status,
      `${app.progress}%`,
      app.daysInReview.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pending-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [applications]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadApplications();
  }, [loadApplications]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    applications,
    isLoading,
    error,
    selectedIds,
    filters,
    quickStats,

    // Actions
    setApplications,
    setIsLoading,
    setError,
    setSelectedIds,
    setFilters,
    setQuickStats,
    loadApplications,
    handleApplicationSelect,
    handleSelectAll,
    handleBulkApprove,
    handleBulkReject,
    handleExport,
    handleRefresh,
    clearError
  };
}

export type usePendingApplicationsListReturn = ReturnType<typeof usePendingApplicationsList>;