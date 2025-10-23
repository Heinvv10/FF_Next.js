/**
 * ContractorsDashboard - Enhanced contractors dashboard with comprehensive metrics
 * Features contractor stats, performance metrics, and management tools
 * Pages Router compatible - no client-side hooks
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserPlus, Download, RefreshCw, Upload, TrendingUp } from 'lucide-react';
import { ContractorList } from './components/ContractorList';
import { PendingApplicationsList } from './components/applications';
import { PerformanceDashboard } from './components/performance';
import { DocumentApprovalQueue } from './components/documents';
import { StatsGrid } from '@/components/dashboard/EnhancedStatCard';
import { getContractorsDashboardCards } from '@/config/dashboards/dashboardConfigs';
import { ContractorImport } from '@/components/contractor/ContractorImport';
import { contractorApiService } from '@/services/contractor/contractorApiService';
import { log } from '@/lib/logger';

interface ContractorsDashboardProps {
  initialStats?: any;
  initialTrends?: any;
}

export function ContractorsDashboard({ initialStats, initialTrends }: ContractorsDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showImportModal, setShowImportModal] = useState(false);
  const [stats, setStats] = useState(initialStats || {
    contractorsActive: 0,
    contractorsPending: 0,
    totalProjects: 0,
    performanceScore: 0,
    qualityScore: 0,
    onTimeDelivery: 0,
  });
  const [trends, setTrends] = useState(initialTrends || {});
  const [topContractors, setTopContractors] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
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
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map((contractor: any) => ({
          name: contractor.companyName,
          score: contractor.performanceScore || 0,
          projects: contractor.activeProjects || 0,
          status: contractor.status
        }));

      setTopContractors(sortedContractors);

      // Generate recent activities from contractor data
      const activities = contractorsResponse
        .slice(0, 3)
        .map((contractor: any, index: number) => ({
          action: `New contractor application: ${contractor.companyName}`,
          time: getTimeAgo(new Date(contractor.createdAt)),
          status: contractor.status
        }));

      setRecentActivities(activities);

      // For now, set empty trends - can be enhanced later
      setTrends({});

    } catch (err) {
      log.error('Failed to load dashboard data:', { data: err }, 'ContractorsDashboard');
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Load data on mount
  useEffect(() => {
    if (!initialStats) {
      loadDashboardData();
    }
  }, []);

  // 🟢 WORKING: Get contractor dashboard cards with safety checks
  const contractorCards = React.useMemo(() => {
    if (!stats || !trends || !formatNumber || !formatCurrency || !formatPercentage) {
      return [];
    }
    return getContractorsDashboardCards(
      stats,
      trends,
      { formatNumber, formatCurrency, formatPercentage }
    );
  }, [stats, trends, formatNumber, formatCurrency, formatPercentage]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'active', label: 'Active Contractors' },
    { id: 'pending', label: 'Pending Applications' },
    { id: 'documents', label: 'Document Approval' },
    { id: 'performance', label: 'Performance Analytics' },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contractors dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️ Error loading dashboard</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contractors Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage contractor relationships and performance</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/contractors/new')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Contractor
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import Contractors
          </button>

          <button
            onClick={() => log.info('Export contractors report', undefined, 'ContractorsDashboard')}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export Report
          </button>

          <button
            onClick={loadDashboardData}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Stats Cards */}
      {activeTab === 'overview' && (
        <>
          <StatsGrid 
            cards={contractorCards}
            columns={3}
            className="mb-8"
          />

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="ff-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                <div className="space-y-4">
                  {topContractors.length > 0 ? (
                    topContractors.map((contractor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{contractor.name}</p>
                          <p className="text-sm text-gray-500">
                            {contractor.projects} active projects • {contractor.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${contractor.score > 80 ? 'text-green-600' : contractor.score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {contractor.score}%
                          </p>
                          <p className="text-xs text-gray-500">Performance</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No contractors yet</p>
                      <p className="text-sm">Create your first contractor to see performance metrics</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ff-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'pending' || activity.status === 'documentation_incomplete' ? 'bg-yellow-400' :
                          activity.status === 'approved' ? 'bg-green-400' :
                          activity.status === 'under_review' ? 'bg-blue-400' :
                          'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No recent activities</p>
                      <p className="text-sm">Activities will appear when contractors are created or updated</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contractor List Views */}
      {activeTab === 'active' && (
        <ContractorList />
      )}
      
      {activeTab === 'pending' && (
        <PendingApplicationsList 
          initialFilter={{
            status: ['pending', 'under_review', 'documentation_incomplete']
          }}
        />
      )}
      
      {activeTab === 'documents' && (
        <DocumentApprovalQueue 
          initialFilter="pending"
          enableBatchOperations={true}
          autoRefreshInterval={30}
        />
      )}
      
      {activeTab === 'performance' && (
        <PerformanceDashboard 
          showFilters={true}
          onContractorSelect={(contractorId) => router.push(`/contractors/${contractorId}`)}
          className="mt-0"
        />
      )}

      {/* Import Modal */}
      <ContractorImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onComplete={(result) => {
          log.info('Import completed:', { data: result }, 'ContractorsDashboard');
          setShowImportModal(false);
          loadDashboardData(); // Refresh dashboard data
        }}
      />
      </div>
    </div>
  );
}

export default ContractorsDashboard;