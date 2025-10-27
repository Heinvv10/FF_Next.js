/**
 * ContractorView Component - Detailed contractor view following FibreFlow patterns
 * Comprehensive contractor information with tabs for teams, assignments, and documents
 */

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useContractorView,
  ContractorViewHeader,
  ContractorTabs,
  TabContent,
  DeleteConfirmModal,
  ContractorNotFound
} from './view';

export function ContractorView() {
  const {
    id,
    contractor,
    isLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    activeTab,
    setActiveTab,
    handleDelete,
    navigate
  } = useContractorView();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" label="Loading contractor..." />
      </div>
    );
  }

  if (!contractor) {
    return <ContractorNotFound onBack={() => navigate('/app/contractors')} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ContractorViewHeader
        contractor={contractor}
        onBack={() => navigate('/app/contractors')}
        onEdit={() => navigate(`/app/contractors/${id}/edit`)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <ContractorTabs
            contractor={contractor}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <TabContent activeTab={activeTab} contractor={contractor} />

      {showDeleteConfirm && (
        <DeleteConfirmModal
          contractorName={contractor.companyName}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}