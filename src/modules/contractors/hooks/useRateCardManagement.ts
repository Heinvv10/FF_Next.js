/**
 * Rate Card Management Hook
 * Business logic for rate card management functionality
 * @module RateCardManagement
 */

import { useState, useEffect, useCallback } from 'react';
import { ContractorRateCard, RateCardSearchParams } from '@/types/contractor';
import { RateCardApiService } from '@/services/contractor';
import { log } from '@/lib/logger';
import { RateCardManagementProps, RateCardManagementState, RateCardManagementActions } from '../components/rate-card/types/rateCardManagement.types';

export function useRateCardManagement(props: RateCardManagementProps) {
  const { contractorId, onRateCardSelect, onRateCardCreate, onRateCardUpdate, onRateCardDelete } = props;

  // Component state
  const [rateCards, setRateCards] = useState<ContractorRateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useState<RateCardSearchParams>({
    contractorId,
    page: 1,
    limit: 20,
    sortBy: 'effectiveDate',
    sortOrder: 'desc'
  });

  // UI State
  const [selectedRateCard, setSelectedRateCard] = useState<ContractorRateCard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  // Load rate cards
  const loadRateCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await RateCardApiService.getRateCards(searchParams);
      setRateCards(response.data);

    } catch (err) {
      setError('Failed to load rate cards');
      log.error('Error loading rate cards:', { data: err }, 'RateCardManagement');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Initialize data loading
  useEffect(() => {
    if (contractorId) {
      loadRateCards();
    }
  }, [contractorId, loadRateCards]);

  // Rate Card Actions
  const handleCreateRateCard = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleEditRateCard = useCallback((rateCard: ContractorRateCard) => {
    setSelectedRateCard(rateCard);
    setShowEditModal(true);
    onRateCardSelect?.(rateCard);
  }, [onRateCardSelect]);

  const handleViewRateCard = useCallback((rateCard: ContractorRateCard) => {
    onRateCardSelect?.(rateCard);
  }, [onRateCardSelect]);

  const handleCloneRateCard = useCallback(async (rateCard: ContractorRateCard) => {
    try {
      const clonedCard = await RateCardApiService.cloneRateCard(rateCard.id, {
        name: `${rateCard.name} (Copy)`,
        effectiveDate: new Date().toISOString()
      });

      setRateCards(prev => [clonedCard, ...prev]);
      onRateCardCreate?.(clonedCard);
    } catch (err) {
      log.error('Error cloning rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to clone rate card');
    }
  }, [onRateCardCreate]);

  const handleArchiveRateCard = useCallback(async (rateCard: ContractorRateCard) => {
    if (!window.confirm('Are you sure you want to archive this rate card?')) {
      return;
    }

    try {
      const updatedCard = await RateCardApiService.updateRateCard(rateCard.id, {
        ...(rateCard as any),
        status: 'archived'
      });

      setRateCards(prev => prev.map(card =>
        card.id === rateCard.id ? updatedCard : card
      ));
      onRateCardUpdate?.(updatedCard);
    } catch (err) {
      log.error('Error archiving rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to archive rate card');
    }
  }, [onRateCardUpdate]);

  const handleDeleteRateCard = useCallback(async (rateCard: ContractorRateCard) => {
    if (!window.confirm('Are you sure you want to delete this rate card? This action cannot be undone.')) {
      return;
    }

    try {
      await RateCardApiService.deleteRateCard(rateCard.id);
      setRateCards(prev => prev.filter(card => card.id !== rateCard.id));
      onRateCardDelete?.(rateCard.id);
    } catch (err) {
      log.error('Error deleting rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to delete rate card');
    }
  }, [onRateCardDelete]);

  const handleSubmitForApproval = useCallback(async (rateCard: ContractorRateCard) => {
    try {
      const updatedCard = await RateCardApiService.submitForApproval(rateCard.id);
      setRateCards(prev => prev.map(card =>
        card.id === rateCard.id ? updatedCard : card
      ));
      onRateCardUpdate?.(updatedCard);
    } catch (err) {
      log.error('Error submitting for approval:', { data: err }, 'RateCardManagement');
      setError('Failed to submit rate card for approval');
    }
  }, [onRateCardUpdate]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    rateCards,
    loading,
    error,
    searchParams,
    selectedRateCard,
    showCreateModal,
    showEditModal,
    showActionsMenu,

    // Actions
    setRateCards,
    setLoading,
    setError,
    setSelectedRateCard,
    setShowCreateModal,
    setShowEditModal,
    setShowActionsMenu,
    handleCreateRateCard,
    handleEditRateCard,
    handleViewRateCard,
    handleCloneRateCard,
    handleArchiveRateCard,
    handleDeleteRateCard,
    handleSubmitForApproval,
    loadRateCards,
    clearError
  };
}

export type useRateCardManagementReturn = ReturnType<typeof useRateCardManagement>;