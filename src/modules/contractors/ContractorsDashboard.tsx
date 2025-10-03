/**
 * ContractorsDashboard - Streamlined contractors dashboard
 * Clean, focused component using hooks and layout components
 */

import { useContractorsDashboard } from './hooks/useContractorsDashboard';
import { ContractorsDashboardLayout } from './components/dashboard/ContractorsDashboardLayout';

interface DashboardStats {
  totalContractors: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageRating: number;
}

interface DashboardTrends {
  contractorGrowth: number;
  projectGrowth: number;
  revenueGrowth: number;
  satisfactionTrend: number;
}

interface ContractorsDashboardProps {
  initialStats?: DashboardStats;
  initialTrends?: DashboardTrends;
}

export function ContractorsDashboard({ initialStats, initialTrends }: ContractorsDashboardProps) {
  const {
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
    handleRefresh,
    handleImport,
    
    // Utilities
    formatNumber,
    formatCurrency,
    formatPercentage,
  } = useContractorsDashboard(initialStats, initialTrends);

  return (
    <ContractorsDashboardLayout
      activeTab={activeTab}
      showImportModal={showImportModal}
      stats={stats}
      topContractors={topContractors}
      recentActivities={recentActivities}
      isLoading={isLoading}
      error={error}
      onTabChange={setActiveTab}
      onImportModalClose={() => setShowImportModal(false)}
      onRefresh={handleRefresh}
      onImport={handleImport}
      formatNumber={formatNumber}
      formatCurrency={formatCurrency}
      formatPercentage={formatPercentage}
    />
  );
}