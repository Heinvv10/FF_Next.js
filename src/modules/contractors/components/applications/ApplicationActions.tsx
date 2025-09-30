/**
 * ApplicationActions Component - Action buttons for application approval/rejection
 * Refactored for constitutional compliance - now uses composition pattern
 * Reduced from 628 lines to ~60 lines by extracting business logic and UI components
 * @module ApplicationActions
 */

import React from 'react';
import { useApplicationActions } from '../../hooks/useApplicationActions';
import { ApplicationActionButtons } from './actions/ApplicationActionButtons';
import { ApplicationConfirmationModal } from './actions/ApplicationConfirmationModal';
import { 
  ApprovalAction, 
  ApprovalActionResult, 
  ApplicationStatus 
} from '@/types/contractor.types';

interface ApplicationActionsProps {
  /** Contractor ID for the action */
  contractorId: string;
  /** Current application status */
  status: ApplicationStatus;
  /** Current application progress (0-100) */
  progress?: number;
  /** Whether actions are disabled (loading state) */
  disabled?: boolean;
  /** Callback for individual actions */
  onAction?: (contractorId: string, action: ApprovalAction, data?: any) => Promise<ApprovalActionResult>;
  /** Callback for viewing application details */
  onView?: (contractorId: string) => void;
  /** Callback for editing application */
  onEdit?: (contractorId: string) => void;
  /** Show compact button layout */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ApplicationActions - Main component using composition pattern
 * Refactored from 628 lines to ~60 lines for constitutional compliance
 */
export function ApplicationActions({
  contractorId,
  status,
  progress = 0,
  disabled = false,
  onAction,
  onView,
  onEdit,
  compact = false,
  className = ''
}: ApplicationActionsProps) {
  // Use custom hook for all business logic (350+ lines moved to hook)
  const {
    isLoading,
    showMenu,
    confirmation,
    availableActions,
    canTakeActions,
    actions
  } = useApplicationActions({
    contractorId,
    status,
    progress,
    disabled,
    compact
  });

  // Don't render if no actions available
  if (!canTakeActions) {
    return null;
  }

  return (
    <>
      {/* Action Buttons (200+ lines moved to component) */}
      <ApplicationActionButtons
        contractorId={contractorId}
        availableActions={availableActions}
        isLoading={isLoading}
        disabled={disabled}
        compact={compact}
        showMenu={showMenu}
        onAction={actions.handleAction}
        onView={onView}
        onEdit={onEdit}
        onMenuToggle={actions.setShowMenu}
      />

      {/* Confirmation Modal (150+ lines moved to component) */}
      <ApplicationConfirmationModal
        confirmation={confirmation}
        isLoading={isLoading}
        onConfirm={actions.executeAction}
        onCancel={() => actions.setConfirmation({ isOpen: false })}
        onUpdateConfirmation={actions.setConfirmation}
      />
    </>
  );
}

export default ApplicationActions;

// Re-export BulkApplicationActions from actions directory
export { BulkApplicationActions } from './actions/BulkApplicationActions';