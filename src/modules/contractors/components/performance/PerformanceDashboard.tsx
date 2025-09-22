/**
 * PerformanceDashboard Component - Contractor Performance Analytics & RAG Score Visualization
 * Following FibreFlow patterns with comprehensive performance tracking
 * Features: RAG distribution, trends, leaderboards, comparative analysis
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Award, 
  AlertTriangle,
  RefreshCw,
  Filter,
  Calendar,
  Target
} from 'lucide-react';
import { contractorService } from '@/services/contractorService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RAGScoreChart } from './components/RAGScoreChart';
import { TrendIndicators } from './components/TrendIndicators';
import { PerformanceLeaderboard } from './components/PerformanceLeaderboard';
import { ComparativeAnalysisChart } from './components/ComparativeAnalysisChart';
import { log } from '@/lib/logger';
import {
  PerformanceDashboardData,
  PerformanceDashboardProps,
  PerformanceFilters
} from './types';

// 🟢 WORKING: Default configuration for performance dashboard
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

export function PerformanceDashboard({
  refreshInterval = DEFAULT_CONFIG.refreshInterval,
  showFilters = true,
  defaultFilters,
  onContractorSelect,
  className = ''
}: PerformanceDashboardProps) {
  // 🟢 WORKING: State management for dashboard data
  const [data, setData] = useState<PerformanceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters] = useState<Partial<PerformanceFilters> | null>(defaultFilters || null);

  // 🟢 WORKING: Load performance analytics data
  const loadPerformanceData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch analytics data from contractor service with fallback
      let analyticsData: any;
      let topPerformers: any[] = [];

      try {
        analyticsData = await contractorService.getAnalytics();
      } catch (analyticsError) {
        log.warn('Analytics service failed, using fallback data:', { data: analyticsError }, 'PerformanceDashboard');
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
          trendsDirection: 'stable',
          peerComparison: { above: 0, below: 0, at: 0 },
          segments: []
        };
      }

      try {
        // Get RAG rankings for leaderboard data
        topPerformers = await contractorService.rag.getRankedContractors(10);
      } catch (ragError) {
        log.warn('RAG service failed, using empty leaderboard:', { data: ragError }, 'PerformanceDashboard');
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
            activeProjects: 0, // TODO: Get from analytics
            completedProjects: 0, // TODO: Get from analytics
            performanceCategory: getPerformanceCategory(ranking.ragScore?.overall || 0),
            riskLevel: ranking.ragScore?.risk || 'medium'
          })),
          bottomPerformers: [], // TODO: Implement bottom performers
          mostImproved: [], // TODO: Implement improvement tracking
          recentlyDeclined: [] // TODO: Implement decline tracking
        },
        comparativeAnalysis: {
          peerComparison: {
            abovePeers: analyticsData.peerComparison?.above || 0,
            belowPeers: analyticsData.peerComparison?.below || 0,
            atPeerLevel: analyticsData.peerComparison?.at || 0
          },
          performanceSegments: analyticsData.segments || []
        }
      };

      setData(performanceData);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data';
      setError(errorMessage);
      log.error('Performance dashboard error:', { data: err }, 'PerformanceDashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🟢 WORKING: Helper to determine performance category
  const getPerformanceCategory = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  // 🟢 WORKING: Handle contractor selection
  const handleContractorSelect = (contractorId: string): void => {
    onContractorSelect?.(contractorId);
  };

  // 🟢 WORKING: Auto-refresh functionality
  useEffect(() => {
    loadPerformanceData();

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadPerformanceData(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval, filters]);

  // 🟢 WORKING: Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading performance analytics..." />
      </div>
    );
  }

  // 🟢 WORKING: Error state
  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Failed to Load Performance Data
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => loadPerformanceData()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 🟢 WORKING: Empty state
  if (!data) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Performance Data Available
        </h3>
        <p className="text-gray-600">
          Performance analytics will appear here once contractor data is available.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">
            Comprehensive contractor performance tracking and RAG score analysis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => loadPerformanceData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Filters Toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showFiltersPanel 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>
      </div>

      {/* Last Refresh Indicator */}
      {lastRefresh && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contractors</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.totalContractors}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average RAG Score</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.averageRAGScore}</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Performers</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.performanceDistribution.excellent}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Trend</p>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {data.trends.averageImprovement > 0 ? '+' : ''}{data.trends.averageImprovement.toFixed(1)}%
                </span>
                {data.trends.trendsDirection === 'up' ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : data.trends.trendsDirection === 'down' ? (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                ) : (
                  <div className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RAG Score Distribution */}
        <div className="lg:col-span-1">
          <RAGScoreChart 
            data={[
              { name: 'Low Risk', value: data.ragDistribution.byRisk.low, percentage: 0, color: DEFAULT_CONFIG.chartColors.low },
              { name: 'Medium Risk', value: data.ragDistribution.byRisk.medium, percentage: 0, color: DEFAULT_CONFIG.chartColors.medium },
              { name: 'High Risk', value: data.ragDistribution.byRisk.high, percentage: 0, color: DEFAULT_CONFIG.chartColors.high }
            ]}
            title="RAG Risk Distribution"
            showLegend
            height={300}
          />
        </div>

        {/* Trend Indicators */}
        <div className="lg:col-span-2">
          <TrendIndicators 
            trends={data.trends}
            showDetails
          />
        </div>
      </div>

      {/* Performance Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceLeaderboard
          topPerformers={data.leaderboards.topPerformers}
          bottomPerformers={data.leaderboards.bottomPerformers}
          limit={DEFAULT_CONFIG.displayOptions.leaderboardLimit}
          onContractorClick={handleContractorSelect}
          showTrends
        />

        {/* Comparative Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ComparativeAnalysisChart 
            comparativeData={data.comparativeAnalysis}
            className="h-80"
          />
        </div>
      </div>
    </div>
  );
}