/**
 * Rate Card Management Component - Refactored for constitutional compliance
 * Now uses composition pattern with extracted business logic
 * Reduced from 490 lines to <200 lines by using hooks and sub-components
 * @module RateCardManagement
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { RateCardManagementProps } from './rate-card/types/rateCardManagement.types';
import { useRateCardManagement } from '../hooks/useRateCardManagement';
import { RateCardList } from './rate-card/components/RateCardList';

/**
 * Rate Card Management Component - Refactored (Main orchestrator)
 */
export function RateCardManagement({
  contractorId,
  onRateCardSelect,
  onRateCardCreate,
  onRateCardUpdate,
  onRateCardDelete
}: RateCardManagementProps) {
  // Use custom hook for business logic
  const hookState = useRateCardManagement({
    contractorId,
    onRateCardSelect,
    onRateCardCreate,
    onRateCardUpdate,
    onRateCardDelete
  });

  const { handleCreateRateCard } = hookState;

  // Main render - delegating to RateCardList component
  return (
    <div className="rate-card-management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rate Cards</h3>
          <p className="text-sm text-gray-500">Manage service rates and pricing for this contractor</p>
        </div>
        <button
          onClick={handleCreateRateCard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Rate Card
        </button>
      </div>

      {/* Rate Cards List - Delegated to extracted component */}
      <RateCardList hookState={hookState} />
    </div>
  );
}