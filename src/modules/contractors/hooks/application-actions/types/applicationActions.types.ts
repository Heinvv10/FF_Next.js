/**
 * Application Actions Hook Types
 * Types for application action management hooks
 * @module ApplicationActions
 */

import { ApprovalAction, ApplicationStatus } from '@/types/contractor.types';

export interface UseApplicationActionsProps {
  contractorId: string;
  status: ApplicationStatus;
  progress?: number;
  disabled?: boolean;
  compact?: boolean;
}

export interface ConfirmationState {
  isOpen: boolean;
  action?: ApprovalAction;
  title?: string;
  message?: string;
  requiresReason?: boolean;
  reason?: string;
  notes?: string;
}

export interface ActionItem {
  action: string;
  label: string;
  icon: any;
  color: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  primary?: boolean;
}

export interface UseApplicationActionsReturn {
  // State
  isLoading: boolean;
  showMenu: boolean;
  confirmation: ConfirmationState;

  // Computed values
  availableActions: ActionItem[];
  canTakeActions: boolean;

  // Actions
  actions: {
    setShowMenu: (show: boolean) => void;
    setConfirmation: (confirmation: ConfirmationState) => void;
    handleAction: (action: ApprovalAction) => Promise<void>;
    executeAction: (action: ApprovalAction, reason?: string, notes?: string) => Promise<void>;
  };
}

export interface UseBulkApplicationActionsProps {
  selectedContractorIds: string[];
  onActionComplete?: () => void;
}

export interface UseBulkApplicationActionsReturn {
  // State
  isLoading: boolean;
  confirmation: ConfirmationState;

  // Actions
  actions: {
    setConfirmation: (confirmation: ConfirmationState) => void;
    handleBulkAction: (action: 'approve' | 'reject') => void;
    executeBulkAction: (action: 'approve' | 'reject', reason?: string, notes?: string) => Promise<void>;
  };
}

// Constants
export const REJECTION_REASONS = [
  'incomplete_documentation',
  'invalid_credentials',
  'failed_verification',
  'policy_violation',
  'other'
] as const;