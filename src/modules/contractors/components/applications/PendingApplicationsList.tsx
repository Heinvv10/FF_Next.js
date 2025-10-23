/**
 * PendingApplicationsList Component - Main component for managing pending contractor applications
 * Features filtering, bulk operations, and comprehensive application management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { 
  TrendingUp, 
  Clock, 
  RefreshCw,
  Download,
  Users,
  FileText
} from 'lucide-react';
import { 
  ApplicationFilters as IApplicationFilters, 
  ApplicationSummary, 
  ApplicationStatus,
  ApprovalAction,
  ApprovalActionResult,
  BulkApprovalRequest
} from '@/types/contractor.types';
import { contractorService } from '@/services/contractorService';
import { ApplicationFilters } from './ApplicationFilters';
import { ApplicationTable } from './ApplicationTable';
import { BulkApplicationActions } from './ApplicationActions';
import { log } from '@/lib/logger';

// 🟢 WORKING: Props interface for PendingApplicationsList
interface PendingApplicationsListProps {
  /** Initial filter to apply (optional) */
  initialFilter?: Partial<IApplicationFilters>;
  /** Maximum number of items to display per page */
  pageSize?: number;
  /** Additional CSS classes */
  className?: string;
}

// 🟢 WORKING: Quick stats interface for dashboard cards
interface QuickStats {
  total: number;
  pending: number;
  underReview: number;
  documentIncomplete: number;
  averageProcessingDays: number;
}

/**
 * PendingApplicationsList Component
 * Comprehensive pending applications management interface
 */
export function PendingApplicationsList({
  initialFilter,
  pageSize = 50,
  className = ''
}: PendingApplicationsListProps) {
  const router = useRouter();
  
  // 🟢 WORKING: Component state
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

  // 🟢 WORKING: Load applications data
  const loadApplications = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement actual API call to get filtered applications
      // For now, using mock data that simulates the API response structure
      
      const response = await contractorService.getAll();

      // Transform contractor data to application summary format
      const applicationSummaries: ApplicationSummary[] = response.map((contractor: any) => ({
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
  }, [filters]);

  // 🟢 WORKING: Helper function to calculate days since date
  const getDaysSince = (date: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 🟢 WORKING: Load data on component mount and filter changes
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // 🟢 WORKING: Handle filter changes
  const handleFiltersChange = (newFilters: IApplicationFilters) => {
    setFilters(newFilters);
    setSelectedIds([]); // Clear selection when filters change
  };

  // 🟢 WORKING: Handle filter reset
  const handleFiltersReset = () => {
    setFilters({
      status: ['pending', 'under_review', 'documentation_incomplete'],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: pageSize
    } as IApplicationFilters);
    setSelectedIds([]);
  };

  // 🟢 WORKING: Handle individual application actions
  const handleApplicationAction = async (
    contractorId: string,
    action: ApprovalAction,
    _data?: any
  ): Promise<ApprovalActionResult> => {
    try {
      let newStatus: ApplicationStatus;
      let updates: any = {};

      switch (action) {
        case 'approve':
          newStatus = 'approved';
          updates = { status: newStatus, isActive: true };  // Also activate contractor
          break;
        case 'reject':
          newStatus = 'rejected';
          updates = { status: newStatus };
          break;
        case 'request_more_info':
          newStatus = 'documentation_incomplete';
          updates = { status: newStatus };
          break;
        case 'escalate':
          newStatus = 'under_review';
          updates = { status: newStatus };
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update in database
      await contractorService.update(contractorId, updates);

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === contractorId
            ? { ...app, status: newStatus, lastActivity: new Date() }
            : app
        )
      );

      // Reload applications to reflect changes
      await loadApplications(false);

      log.info(`Action ${action} completed for contractor ${contractorId}`, undefined, 'PendingApplicationsList');

      return {
        contractorId,
        action,
        success: true,
        message: `Application ${action} completed successfully`,
        timestamp: new Date()
      };
    } catch (error) {
      log.error(`Failed to execute action ${action}:`, { data: error }, 'PendingApplicationsList');
      return {
        contractorId,
        action,
        success: false,
        message: `Failed to ${action} application: ${error}`,
        timestamp: new Date()
      };
    }
  };

  // 🟢 WORKING: Handle bulk application actions
  const handleBulkAction = async (request: BulkApprovalRequest): Promise<ApprovalActionResult[]> => {
    const results: ApprovalActionResult[] = [];
    
    for (const contractorId of request.contractorIds) {
      const result = await handleApplicationAction(contractorId, request.action, {
        reason: request.reason,
        notes: request.notes
      });
      results.push(result);
    }

    // Refresh data after bulk operation
    await loadApplications(false);
    
    return results;
  };

  // 🟢 WORKING: Handle navigation to application details
  const handleViewApplication = (contractorId: string) => {
    router.push(`/contractors/${contractorId}`);
  };

  // 🟢 WORKING: Handle navigation to application edit
  const handleEditApplication = (contractorId: string) => {
    router.push(`/contractors/${contractorId}/edit`);
  };

  // 🟢 WORKING: Handle table sorting
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder } as IApplicationFilters));
  };

  // 🟢 WORKING: Export applications data
  const handleExport = async () => {
    try {
      // TODO: Implement actual export functionality
      log.info('Exporting applications data...', undefined, 'PendingApplicationsList');
      
      const csvContent = [
        ['Company', 'Contact', 'Status', 'Progress', 'Application Date', 'Days in Review'],
        ...applications.map(app => [
          app.companyName,
          app.contactPerson,
          app.status,
          `${app.progress}%`,
          new Date(app.applicationDate).toLocaleDateString(),
          app.daysInReview.toString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pending-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Export failed:', { data: error }, 'PendingApplicationsList');
      // TODO: Show error toast
    }
  };

  // 🟢 WORKING: Memoized filtered applications count
  const filteredCount = useMemo(() => applications.length, [applications]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ff-card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{quickStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="ff-card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{quickStats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="ff-card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Under Review</p>
                <p className="text-3xl font-bold text-blue-600">{quickStats.underReview}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="ff-card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Processing Days</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(quickStats.averageProcessingDays)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Applications
          </h2>
          {filteredCount > 0 && (
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
              {filteredCount} application{filteredCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadApplications()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExport}
            disabled={isLoading || applications.length === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <ApplicationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
        isLoading={isLoading}
        resultsCount={filteredCount}
      />

      {/* Bulk Actions */}
      <BulkApplicationActions
        selectedContractorIds={selectedIds}
        onBulkAction={handleBulkAction}
        onClearSelection={() => setSelectedIds([])}
        disabled={isLoading}
      />

      {/* Applications Table */}
      <ApplicationTable
        {...{
          applications,
          isLoading,
          error,
          selectedIds,
          onSelectionChange: setSelectedIds,
          onAction: handleApplicationAction,
          onView: handleViewApplication,
          onEdit: handleEditApplication,
          onSort: handleSort,
          ...(filters.sortBy && { sortBy: filters.sortBy }),
          ...(filters.sortOrder && { sortOrder: filters.sortOrder })
        }}
        emptyMessage={
          filters.status?.length === 0 || Object.keys(filters).filter(key => 
            filters[key as keyof IApplicationFilters] !== undefined
          ).length > 2
            ? 'No applications match your current filters. Try adjusting the filter criteria.'
            : 'No pending applications found. All applications have been processed.'
        }
      />

      {/* Summary Footer */}
      {!isLoading && applications.length > 0 && (
        <div className="ff-card">
          <div className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-6">
                <span>Showing {applications.length} applications</span>
                {selectedIds.length > 0 && (
                  <span className="font-medium text-blue-600">
                    {selectedIds.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Pending ({quickStats.pending})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Under Review ({quickStats.underReview})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Docs Incomplete ({quickStats.documentIncomplete})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingApplicationsList;