/**
 * Rate Card List Component
 * Displays list of rate cards with loading and error states
 * @module RateCardManagement
 */

import React from 'react';
import { Plus, AlertTriangle, FileText } from 'lucide-react';
import { useRateCardManagementReturn } from '../../../hooks/useRateCardManagement';
import { RateCardItem } from './RateCardItem';

interface RateCardListProps {
  hookState: useRateCardManagementReturn;
}

export function RateCardList({ hookState }: RateCardListProps) {
  const {
    rateCards,
    loading,
    error,
    handleCreateRateCard,
    handleEditRateCard,
    handleViewRateCard,
    handleCloneRateCard,
    handleArchiveRateCard,
    handleDeleteRateCard,
    handleSubmitForApproval,
    clearError
  } = hookState;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-red-900 mb-1">
          Error Loading Rate Cards
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={clearError}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Dismiss
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rateCards.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Rate Cards Found
        </h3>
        <p className="text-gray-600 mb-6">
          Get started by creating your first rate card for this contractor.
        </p>
        <button
          onClick={handleCreateRateCard}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rate Card
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rateCards.map((rateCard) => (
        <RateCardItem
          key={rateCard.id}
          rateCard={rateCard}
          onEdit={() => handleEditRateCard(rateCard)}
          onView={() => handleViewRateCard(rateCard)}
          onClone={() => handleCloneRateCard(rateCard)}
          onArchive={() => handleArchiveRateCard(rateCard)}
          onDelete={() => handleDeleteRateCard(rateCard)}
          onSubmitForApproval={() => handleSubmitForApproval(rateCard)}
        />
      ))}
    </div>
  );
}