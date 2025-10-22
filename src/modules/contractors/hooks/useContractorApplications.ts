/**
 * Hook for managing contractor applications data and operations
 */

import { useState, useEffect } from 'react';
import { ContractorApplication, ApplicationFilter, ApplicationStats, ApplicationAction } from '../components/applications/ApplicationTypes';

interface UseContractorApplicationsReturn {
  applications: ContractorApplication[];
  stats: ApplicationStats;
  filters: ApplicationFilter;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: Partial<ApplicationFilter>) => void;
  handleApplicationAction: (action: ApplicationAction) => Promise<void>;
  refreshApplications: () => Promise<void>;
}

export function useContractorApplications(): UseContractorApplicationsReturn {
  const [applications, setApplications] = useState<ContractorApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inReview: 0,
  });
  const [filters, setFiltersState] = useState<ApplicationFilter>({
    status: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load applications data
  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/contractors');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();

      // Handle empty or invalid responses
      const contractors = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

      // Transform contractor data to application format
      const transformedApplications: ContractorApplication[] = contractors.map((contractor: any) => ({
        id: contractor.id,
        companyName: contractor.companyName,
        contactPerson: contractor.contactPerson,
        email: contractor.email,
        phone: contractor.phone,
        registrationNumber: contractor.registrationNumber,
        businessType: contractor.businessType,
        industryCategory: contractor.industryCategory,
        status: contractor.status,
        complianceStatus: contractor.complianceStatus,
        ragOverall: contractor.ragOverall,
        ragFinancial: contractor.ragFinancial,
        ragCompliance: contractor.ragCompliance,
        ragPerformance: contractor.ragPerformance,
        ragSafety: contractor.ragSafety,
        onboardingProgress: contractor.onboardingProgress,
        documentsExpiring: contractor.documentsExpiring,
        createdAt: contractor.createdAt,
        updatedAt: contractor.updatedAt,
        notes: contractor.notes,
      }));

      // Apply filters
      const filteredApplications = filterApplications(transformedApplications, filters);
      setApplications(filteredApplications);

      // Calculate stats
      const newStats = calculateStats(transformedApplications);
      setStats(newStats);

    } catch (error) {
      setError(`Failed to load applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter applications based on current filters
  const filterApplications = (apps: ContractorApplication[], filter: ApplicationFilter): ContractorApplication[] => {
    return apps.filter(app => {
      // Status filter
      if (filter.status !== 'all' && app.status !== filter.status) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          app.companyName.toLowerCase().includes(searchLower) ||
          app.contactPerson.toLowerCase().includes(searchLower) ||
          app.email.toLowerCase().includes(searchLower)
        );
      }

      // Date range filter (if implemented)
      if (filter.dateRange.start || filter.dateRange.end) {
        const appDate = new Date(app.createdAt);
        if (filter.dateRange.start && appDate < new Date(filter.dateRange.start)) {
          return false;
        }
        if (filter.dateRange.end && appDate > new Date(filter.dateRange.end)) {
          return false;
        }
      }

      return true;
    });
  };

  // Calculate statistics
  const calculateStats = (apps: ContractorApplication[]): ApplicationStats => {
    return apps.reduce((acc, app) => {
      acc.total++;
      switch (app.status) {
        case 'pending':
          acc.pending++;
          break;
        case 'approved':
          acc.approved++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
        case 'in_review':
          acc.inReview++;
          break;
      }
      return acc;
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      inReview: 0,
    });
  };

  // Handle application actions
  const handleApplicationAction = async (action: ApplicationAction): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Call API endpoint to update contractor status
      const response = await fetch(`/api/contractors/${action.contractorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action.type === 'approve' ? 'approved' :
                 action.type === 'reject' ? 'rejected' :
                 action.type === 'request_more_info' ? 'under_review' : 'under_review',
          notes: action.notes,
          // Note: nextReviewDate is not currently stored in contractors table
          // It would need to be added if required
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.type} application`);
      }

      // Refresh the applications list
      await loadApplications();
    } catch (error) {
      setError(`Failed to process action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update filters
  const setFilters = (newFilters: Partial<ApplicationFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  // Refresh applications
  const refreshApplications = async () => {
    await loadApplications();
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadApplications();
  }, [filters.status, filters.search, filters.dateRange.start, filters.dateRange.end]);

  return {
    applications,
    stats,
    filters,
    isLoading,
    error,
    setFilters,
    handleApplicationAction,
    refreshApplications,
  };
}