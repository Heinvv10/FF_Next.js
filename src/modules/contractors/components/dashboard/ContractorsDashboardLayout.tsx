/**
 * ContractorsDashboardLayout - Main layout and tab management
 * Handles the overall structure and navigation of the contractors dashboard
 */

import React from 'react';
import { UserPlus, Download, RefreshCw, Upload, TrendingUp } from 'lucide-react';
import { StatsGrid } from '@/components/dashboard/EnhancedStatCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getContractorsDashboardCards } from '@/config/dashboards/dashboardConfigs';
import { ContractorImport } from '@/components/contractor/ContractorImport';
import { ContractorList } from '../ContractorList';
import { PendingApplicationsList } from '../applications';
import { PerformanceDashboard } from '../performance';
import { DocumentApprovalQueue } from '../documents';
import ContractorDropsTab from '../ContractorDropsTab';

interface ContractorsDashboardLayoutProps {
  activeTab: string;
  showImportModal: boolean;
  stats: any;
  topContractors: any[];
  recentActivities: any[];
  isLoading: boolean;
  error: string | null;
  onTabChange: (tab: string) => void;
  onImportModalClose: () => void;
  onRefresh: () => void;
  onImport: () => void;
  formatNumber: (num: number) => string;
  formatCurrency: (num: number) => string;
  formatPercentage: (num: number) => string;
}

export function ContractorsDashboardLayout({
  activeTab,
  showImportModal,
  stats,
  topContractors,
  recentActivities,
  isLoading,
  error,
  onTabChange,
  onImportModalClose,
  onRefresh,
  onImport,
  formatNumber,
  formatCurrency,
  formatPercentage
}: ContractorsDashboardLayoutProps) {

  // Generate dashboard cards based on current stats (with safe defaults)
  const dashboardCards = getContractorsDashboardCards(
    {
      contractorsActive: stats?.contractorsActive || 0,
      contractorsPending: stats?.contractorsPending || 0,
      totalProjects: stats?.totalProjects || 0,
      performanceScore: stats?.performanceScore || 0,
      qualityScore: stats?.qualityScore || 0,
      onTimeDelivery: stats?.onTimeDelivery || 0,
    },
    // Empty trends object (not used yet)
    {},
    // Formatters object
    {
      formatNumber,
      formatCurrency,
      formatPercentage,
    }
  );

  // Tab navigation items
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'contractors', label: 'Contractors', icon: UserPlus },
    { id: 'applications', label: 'Applications', icon: Upload },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'drops', label: 'Drops', icon: Download },
  ];

  // Header actions
  const headerActions = [
    {
      label: 'Import Contractors',
      onClick: onImport,
      icon: Upload,
      variant: 'default' as const
    },
    {
      label: 'Refresh Data',
      onClick: onRefresh,
      icon: RefreshCw,
      variant: 'outline' as const
    }
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader 
        title="Contractors Management"
        subtitle="Manage contractors, applications, and performance metrics"
        actions={headerActions}
      />

      {/* Stats Grid */}
      <StatsGrid cards={dashboardCards} />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Contractors */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Contractors</h3>
                <div className="space-y-3">
                  {topContractors.length === 0 ? (
                    <p className="text-gray-500">No contractors found</p>
                  ) : (
                    topContractors.map((contractor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium">{contractor.name}</div>
                          <div className="text-sm text-gray-500">Rating: {contractor.rating}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{contractor.score}%</div>
                          <div className="text-sm text-gray-500">{contractor.projects} projects</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-gray-500">No recent activities</p>
                  ) : (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="font-medium">{activity.message}</div>
                        <div className="text-sm text-gray-500">
                          {activity.contractor} • {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contractors' && <ContractorList />}
        {activeTab === 'applications' && <PendingApplicationsList />}
        {activeTab === 'performance' && <PerformanceDashboard />}
        {activeTab === 'documents' && <DocumentApprovalQueue />}
        {activeTab === 'drops' && <ContractorDropsTab />}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ContractorImport 
          isOpen={showImportModal}
          onClose={onImportModalClose}
        />
      )}
    </div>
  );
}