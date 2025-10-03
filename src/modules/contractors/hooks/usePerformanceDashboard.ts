/**
 * Performance Dashboard Hook
 * Business logic for performance analytics dashboard
 * @module PerformanceDashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { contractorApiService } from '@/services/contractor/contractorApiService';
import { log } from '@/lib/logger';
import {
  PerformanceDashboardData,
  PerformanceDashboardProps,
  PerformanceFilters
} from '../components/performance/types';

// Default configuration
const DEFAULT_CONFIG = {
  refreshInterval: 300000, // 5 minutes
  chartColors: {
    excellent: '#10b981',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#ef4444',
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  },
  displayOptions: {
    showTrends: true,
    showComparative: true,
    showLeaderboards: true,
    leaderboardLimit: 10
  }
};

interface UsePerformanceDashboardProps extends Omit<PerformanceDashboardProps, 'className'> {}

interface UsePerformanceDashboardReturn {
  // State
  data: PerformanceDashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;
  showFiltersPanel: boolean;
  filters: Partial<PerformanceFilters> | null;

  // Actions
  setShowFiltersPanel: (show: boolean) => void;
  loadPerformanceData: (isRefresh?: boolean) => Promise<void>;
  handleContractorSelect: (contractorId: string) => void;
  clearError: () => void;

  // Computed
  config: typeof DEFAULT_CONFIG;
}

export function usePerformanceDashboard({
  refreshInterval = DEFAULT_CONFIG.refreshInterval,
  defaultFilters,
  onContractorSelect
}: UsePerformanceDashboardProps): UsePerformanceDashboardReturn {
  // State management
  const [data, setData] = useState<PerformanceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters] = useState<Partial<PerformanceFilters> | null>(defaultFilters || null);

  /**
   * Helper to determine performance category
   */
  const getPerformanceCategory = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  /**
   * Load performance analytics data
   */
  const loadPerformanceData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch performance analytics from the new API endpoint
      let performanceAnalytics: any;
      let analyticsData: any;
      let topPerformers: any[] = [];

      try {
        const response = await fetch('/api/contractors/analytics/contractors-performance');
        if (response.ok) {
          const result = await response.json();
          performanceAnalytics = result.data;
          log.info('Performance analytics loaded successfully', {
            contractorCount: performanceAnalytics.topPerformers.length
          }, 'usePerformanceDashboard');
        } else {
          throw new Error('Performance analytics API not available');
        }
      } catch (analyticsError) {
        log.warn('Performance analytics API failed, using contractor service fallback:', { data: analyticsError }, 'usePerformanceDashboard');

        // Fallback to original contractor service
        const summary = await contractorApiService.getContractorSummary();
        const contractors = await contractorApiService.getAll();

        analyticsData = {
          totalContractors: summary.totalContractors,
          averageRating: summary.averageRating,
          averageHourlyRate: summary.averageHourlyRate,
          topRatedContractors: contractors.slice(0, 5),
          contractorsBySpecialization: {},
          recentlyAdded: contractors.slice(0, 5),
          averageRAGScore: summary.averageRating,
          performanceBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0 },
          riskDistribution: { low: 0, medium: 0, high: 0 },
          scoreDistribution: [],
          performanceTrends: [],
          averageImprovement: 0,
          trendsDirection: 'stable' as const,
          peerComparison: { above: 0, below: 0, at: 0 },
          segments: []
        };
      } catch (analyticsError) {
        log.warn('Analytics service failed, using fallback data:', { data: analyticsError }, 'usePerformanceDashboard');
        // Provide fallback analytics data
        analyticsData = {
          totalContractors: 0,
          averageRating: 0,
          averageHourlyRate: 0,
          topRatedContractors: [],
          contractorsBySpecialization: {},
          recentlyAdded: [],
          averageRAGScore: 0,
          performanceBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0 },
          riskDistribution: { low: 0, medium: 0, high: 0 },
          scoreDistribution: [],
          performanceTrends: [],
          averageImprovement: 0,
          trendsDirection: 'stable' as const,
          peerComparison: { above: 0, below: 0, at: 0 },
          segments: []
        };
      }

      try {
        // Get top rated contractors for leaderboard data
        topPerformers = await contractorApiService.getTopRatedContractors(10);
        topPerformers = topPerformers.map(contractor => ({
          contractorId: contractor.id,
          companyName: contractor.companyName,
          ragScore: { overall: contractor.performanceScore || 0 },
          performanceScore: contractor.performanceScore || 0
        }));
      } catch (ragError) {
        log.warn('Top contractors service failed, using empty leaderboard:', { data: ragError }, 'usePerformanceDashboard');
        topPerformers = [];
      }

      // Transform the data into performance dashboard format
      const performanceData: PerformanceDashboardData = {
        overview: {
          totalContractors: analyticsData.totalContractors || 0,
          averageRAGScore: analyticsData.averageRAGScore || 0,
          performanceDistribution: {
            excellent: analyticsData.performanceBreakdown?.excellent || 0,
            good: analyticsData.performanceBreakdown?.good || 0,
            fair: analyticsData.performanceBreakdown?.fair || 0,
            poor: analyticsData.performanceBreakdown?.poor || 0
          },
          lastUpdated: new Date()
        },
        ragDistribution: {
          byRisk: {
            low: analyticsData.riskDistribution?.low || 0,
            medium: analyticsData.riskDistribution?.medium || 0,
            high: analyticsData.riskDistribution?.high || 0
          },
          byScore: analyticsData.scoreDistribution || []
        },
        trends: {
          timeRange: '30 days',
          data: analyticsData.performanceTrends || [],
          averageImprovement: analyticsData.averageImprovement || 0,
          trendsDirection: analyticsData.trendsDirection || 'stable'
        },
        leaderboards: {
          topPerformers: topPerformers.map(ranking => ({
            contractorId: ranking.contractorId,
            companyName: ranking.companyName,
            currentRAGScore: ranking.ragScore,
            scoreTrend: {
              direction: 'stable' as const,
              change: 0,
              percentageChange: 0
            },
            activeProjects: performanceAnalytics?.activeProjects || 0,
            completedProjects: performanceAnalytics?.completedProjects || 0,
            performanceCategory: getPerformanceCategory(ranking.ragScore?.overall || 0),
            riskLevel: ranking.ragScore?.risk || 'medium'
          })),
          bottomPerformers: performanceAnalytics?.bottomPerformers || [],
          mostImproved: performanceAnalytics?.mostImproved || [],
          recentlyDeclined: performanceAnalytics?.recentlyDeclined || []
        },
        comparativeAnalysis: {
          peerComparison: {
            abovePeers: performanceAnalytics?.comparativeAnalysis?.peerComparison?.abovePeers || analyticsData.peerComparison?.above || 0,
            belowPeers: performanceAnalytics?.comparativeAnalysis?.peerComparison?.belowPeers || analyticsData.peerComparison?.below || 0,
            atPeerLevel: performanceAnalytics?.comparativeAnalysis?.peerComparison?.atPeerLevel || analyticsData.peerComparison?.at || 0,
            averageScore: performanceAnalytics?.comparativeAnalysis?.peerComparison?.averageScore || 78.5,
            industryBenchmark: performanceAnalytics?.comparativeAnalysis?.peerComparison?.industryBenchmark || 82.0,
            ranking: performanceAnalytics?.comparativeAnalysis?.peerComparison?.ranking || 'Above Average'
          },
          performanceSegments: analyticsData.segments || performanceAnalytics?.comparativeAnalysis?.performanceSegments || [],
          performanceDistribution: performanceAnalytics?.comparativeAnalysis?.performanceDistribution || {
            excellent: 0, good: 0, average: 0, poor: 0, critical: 0
          }
        }
      };

      setData(performanceData);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data';
      setError(errorMessage);
      log.error('Performance dashboard error:', { data: err }, 'usePerformanceDashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Handle contractor selection
   */
  const handleContractorSelect = useCallback((contractorId: string): void => {
    onContractorSelect?.(contractorId);
  }, [onContractorSelect]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    loadPerformanceData();

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadPerformanceData(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [loadPerformanceData, refreshInterval, filters]);

  return {
    // State
    data,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    showFiltersPanel,
    filters,

    // Actions
    setShowFiltersPanel,
    loadPerformanceData,
    handleContractorSelect,
    clearError,

    // Computed
    config: DEFAULT_CONFIG
  };
}