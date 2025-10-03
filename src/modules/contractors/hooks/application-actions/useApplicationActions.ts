/**
 * Application Actions Hook
 * Business logic for individual application actions
 * @module ApplicationActions
 */

import { useState, useCallback, useMemo } from 'react';
import { ApprovalAction } from '@/types/contractor.types';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';
import {
  UseApplicationActionsProps,
  UseApplicationActionsReturn,
  ConfirmationState
} from './types/applicationActions.types';
import {
  getAvailableActions,
  ACTION_LABELS,
  ACTION_MESSAGES,
  SUCCESS_LABELS,
  CONFIRMATION_REQUIRED,
  REASON_REQUIRED
} from './utils/actionConfig';

export function useApplicationActions({
  contractorId,
  status,
  progress = 0,
  disabled = false,
  compact = false
}: UseApplicationActionsProps): UseApplicationActionsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false });

  /**
   * Define available actions based on current status
   */
  const availableActions = useMemo(() => {
    return getAvailableActions(status, compact);
  }, [status, compact]);

  /**
   * Check if actions can be taken
   */
  const canTakeActions = useMemo(() => {
    return !disabled && availableActions.length > 0;
  }, [disabled, availableActions]);

  /**
   * Handle action click with confirmation if needed
   */
  const handleAction = useCallback(async (action: ApprovalAction) => {
    // Close any open menu
    setShowMenu(false);

    if (CONFIRMATION_REQUIRED.includes(action)) {
      setConfirmation({
        isOpen: true,
        action,
        title: ACTION_LABELS[action] || 'Confirm Action',
        message: ACTION_MESSAGES[action] || 'Are you sure you want to proceed?',
        requiresReason: REASON_REQUIRED.includes(action),
        reason: '',
        notes: ''
      });
    } else {
      // Execute action directly
      await executeAction(action);
    }
  }, []);

  /**
   * Execute the actual action
   */
  const executeAction = useCallback(async (
    action: ApprovalAction,
    reason?: string,
    notes?: string
  ) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual service call when available
      // const result = await contractorService.performAction(contractorId, action, {
      //   reason,
      //   notes
      // });

      // Mock successful action for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      log.info('Application action executed:', {
        contractorId,
        action,
        reason,
        notes
      }, 'useApplicationActions');

      // Show success message
      toast.success(`Application ${SUCCESS_LABELS[action] || 'updated'} successfully`);

      // Close confirmation modal
      setConfirmation({ isOpen: false });

    } catch (error) {
      log.error('Failed to execute application action:', {
        data: error,
        contractorId,
        action
      }, 'useApplicationActions');

      toast.error('Failed to process action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [contractorId]);

  return {
    // State
    isLoading,
    showMenu,
    confirmation,

    // Computed values
    availableActions,
    canTakeActions,

    // Actions
    actions: {
      setShowMenu,
      setConfirmation,
      handleAction,
      executeAction
    }
  };
}