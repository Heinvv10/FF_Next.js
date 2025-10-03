/**
 * Pending Applications List Types
 * @module PendingApplicationsList
 */

import { ApplicationFilters as IApplicationFilters, ApplicationSummary } from '@/types/contractor.types';

export interface PendingApplicationsListProps {
  initialFilter?: Partial<IApplicationFilters>;
  pageSize?: number;
  className?: string;
}

export interface QuickStats {
  total: number;
  pending: number;
  underReview: number;
  documentIncomplete: number;
  averageProcessingDays: number;
}

export interface PendingApplicationsListState {
  applications: ApplicationSummary[];
  isLoading: boolean;
  error: string | null;
  selectedIds: string[];
  filters: IApplicationFilters;
  quickStats: QuickStats;
}

export interface PendingApplicationsListActions {
  setApplications: (apps: ApplicationSummary[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setFilters: (filters: IApplicationFilters) => void;
  setQuickStats: (stats: QuickStats) => void;
  loadApplications: (showLoading?: boolean) => Promise<void>;
  handleApplicationSelect: (id: string) => void;
  handleSelectAll: (checked: boolean) => void;
  handleBulkApprove: () => Promise<void>;
  handleBulkReject: () => Promise<void>;
  handleExport: () => void;
  handleRefresh: () => void;
  clearError: () => void;
}

export interface QuickStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

export interface ApplicationHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
  selectedCount: number;
  totalApplications: number;
}

export interface QuickStatsGridProps {
  stats: QuickStats;
  className?: string;
}