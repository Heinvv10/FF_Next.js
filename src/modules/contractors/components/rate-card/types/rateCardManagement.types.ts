/**
 * Rate Card Management Types
 * @module RateCardManagement
 */

import { ContractorRateCard, RateCardSearchParams } from '@/types/contractor';

export interface RateCardManagementProps {
  contractorId: string;
  onRateCardSelect?: (rateCard: ContractorRateCard) => void;
  onRateCardCreate?: (rateCard: ContractorRateCard) => void;
  onRateCardUpdate?: (rateCard: ContractorRateCard) => void;
  onRateCardDelete?: (rateCardId: string) => void;
}

export interface RateCardManagementState {
  rateCards: ContractorRateCard[];
  loading: boolean;
  error: string | null;
  searchParams: RateCardSearchParams;
  selectedRateCard: ContractorRateCard | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showActionsMenu: string | null;
}

export interface RateCardManagementActions {
  setRateCards: (cards: ContractorRateCard[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedRateCard: (card: ContractorRateCard | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowActionsMenu: (menuId: string | null) => void;
  handleCreateRateCard: () => void;
  handleEditRateCard: (rateCard: ContractorRateCard) => void;
  handleViewRateCard: (rateCard: ContractorRateCard) => void;
  handleCloneRateCard: (rateCard: ContractorRateCard) => Promise<void>;
  handleArchiveRateCard: (rateCard: ContractorRateCard) => Promise<void>;
  handleDeleteRateCard: (rateCard: ContractorRateCard) => Promise<void>;
  handleSubmitForApproval: (rateCard: ContractorRateCard) => Promise<void>;
  loadRateCards: () => Promise<void>;
}

export interface StatusBadgeProps {
  status: ContractorRateCard['status'];
}

export interface ApprovalBadgeProps {
  status: ContractorRateCard['approvalStatus'];
}

export interface RateCardActionsMenuProps {
  rateCard: ContractorRateCard;
  onEdit: () => void;
  onView: () => void;
  onClone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSubmitForApproval: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export interface RateCardItemProps {
  rateCard: ContractorRateCard;
  onEdit: () => void;
  onView: () => void;
  onClone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSubmitForApproval: () => void;
}