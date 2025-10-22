/**
 * useContractorsDashboard - Business logic hook for contractors dashboard
 * Extracts all data fetching, state management, and business logic
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { contractorApiService } from '@/services/contractor/contractorApiService';
import { log } from '@/lib/logger';

interface DashboardStats {
  contractorsActive: number;
  contractorsPending: number;
  totalProjects: number;
  performanceScore: number;
  qualityScore: number;
  onTimeDelivery: number;
}

interface DashboardTrends {
  contractorGrowth: number;
  projectGrowth: number;
  revenueGrowth: number;
  satisfactionTrend: number;
}

interface TopContractor {
  name: string;
  score: number;
  projects: number;
  rating: string | number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  contractor?: string;
}

interface DashboardData {
  stats: DashboardStats;
  topContractors: TopContractor[];
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: string | null;
}

interface UseContractorsDashboardReturn extends DashboardData {
  activeTab: string;
  showImportModal: boolean;
  setActiveTab: (tab: string) => void;
  setShowImportModal: (show: boolean) => void;
  loadDashboardData: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleImport: () => void;
  formatNumber: (num: number) => string;
  formatCurrency: (num: number) => string;
  formatPercentage: (num: number) => string;
}

export function useContractorsDashboard(
  initialStats?: DashboardStats,
  _initialTrends?: DashboardTrends
): UseContractorsDashboardReturn {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showImportModal, setShowImportModal] = useState(false);

  // Ensure stats is always properly initialized
  const defaultStats: DashboardStats = {
    contractorsActive: 0,
    contractorsPending: 0,
    totalProjects: 0,
    performanceScore: 0,
    qualityScore: 0,
    onTimeDelivery: 0,
  };

  const [stats, setStats] = useState<DashboardStats>(initialStats || defaultStats);
  const [topContractors, setTopContractors] = useState<TopContractor[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utility functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResponse, contractorsResponse] = await Promise.all([
        fetch('/api/analytics/dashboard/stats'),
        contractorApiService.getAll()
      ]);

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();

      setStats({
        contractorsActive: statsData.data.contractorsActive || 0,
        contractorsPending: statsData.data.contractorsPending || 0,
        totalProjects: statsData.data.totalProjects || 0,
        performanceScore: statsData.data.performanceScore || 0,
        qualityScore: statsData.data.qualityScore || 0,
        onTimeDelivery: statsData.data.onTimeDelivery || 0,
      });

      // Set top contractors (all contractors for now, sorted by creation date)
      const sortedContractors = contractorsResponse
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const dateA = new Date(a.createdAt as string).getTime();
          const dateB = new Date(b.createdAt as string).getTime();
          return dateB - dateA;
        })
        .slice(0, 3)
        .map((contractor: Record<string, unknown>): TopContractor => ({
          name: (contractor.companyName as string) || 'Unknown',
          score: (contractor.performanceScore as number) || 0,
          projects: (contractor.activeProjects as number) || 0,
          rating: (contractor.ragScore as Record<string, unknown>)?.overallRating || 'Not Rated'
        }));

      setTopContractors(sortedContractors);

      // Mock recent activities (would be replaced with real API)
      setRecentActivities([
        {
          id: '1',
          type: 'new_contractor',
          message: 'New contractor registered',
          timestamp: new Date().toISOString(),
          contractor: sortedContractors[0]?.name || 'Unknown'
        },
        {
          id: '2',
          type: 'document_approved',
          message: 'Documents approved',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          contractor: sortedContractors[1]?.name || 'Unknown'
        }
      ]);

    } catch (error) {
      log.error('Error loading dashboard data', { error });
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle URL query parameters (e.g., ?status=pending)
  useEffect(() => {
    console.log('[useContractorsDashboard] Query params changed:', router.query);
    if (router.query.status === 'pending') {
      console.log('[useContractorsDashboard] Setting active tab to applications');
      setActiveTab('applications');
    }
  }, [router.query.status]);

  // Handle refresh action
  const handleRefresh = async () => {
    await loadDashboardData();
  };

  // Handle import action
  const handleImport = () => {
    setShowImportModal(true);
  };

  return {
    // State
    activeTab,
    showImportModal,
    stats,
    topContractors,
    recentActivities,
    isLoading,
    error,
    
    // Actions
    setActiveTab,
    setShowImportModal,
    loadDashboardData,
    handleRefresh,
    handleImport,
    
    // Utilities
    formatNumber,
    formatCurrency,
    formatPercentage,
  };
}