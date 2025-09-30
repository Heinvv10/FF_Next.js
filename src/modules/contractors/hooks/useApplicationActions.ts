/**
 * useApplicationActions - Business logic hook for application action operations
 * Extracted from ApplicationActions.tsx to comply with project constitution
 * Handles action processing, confirmation flow, and state management
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  ApprovalAction, 
  ApprovalActionResult, 
  ApplicationStatus,
  BulkApprovalRequest 
} from '@/types/contractor.types';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';
import { 
  Check, 
  X, 
  MessageCircle, 
  ArrowUp, 
  AlertTriangle,
  Eye,
  Edit,
  Send,
  FileText
} from 'lucide-react';

interface UseApplicationActionsProps {
  contractorId: string;
  status: ApplicationStatus;
  progress?: number;
  disabled?: boolean;
  compact?: boolean;
}

interface ConfirmationState {
  isOpen: boolean;
  action?: ApprovalAction;
  title?: string;
  message?: string;
  requiresReason?: boolean;
  reason?: string;
  notes?: string;
}

interface ActionItem {
  action: string;
  label: string;
  icon: any;
  color: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  primary?: boolean;
}

interface UseApplicationActionsReturn {
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

// Predefined rejection reasons
const REJECTION_REASONS = [
  'incomplete_documentation',
  'invalid_credentials', 
  'failed_verification',
  'policy_violation',
  'other'
];

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
  const availableActions = useMemo((): ActionItem[] => {
    const actions: ActionItem[] = [];

    switch (status) {
      case 'pending':
        actions.push(
          {
            action: 'approve',
            label: 'Approve',
            icon: Check,
            color: 'green',
            primary: true
          },
          {
            action: 'reject',
            label: 'Reject',
            icon: X,
            color: 'red',
            primary: compact
          },
          {
            action: 'request_info',
            label: 'Request Info',
            icon: MessageCircle,
            color: 'orange'
          }
        );
        break;

      case 'info_requested':
        actions.push(
          {
            action: 'approve',
            label: 'Approve',
            icon: Check,
            color: 'green',
            primary: true
          },
          {
            action: 'reject',
            label: 'Reject',
            icon: X,
            color: 'red'
          },
          {
            action: 'escalate',
            label: 'Escalate',
            icon: ArrowUp,
            color: 'blue'
          }
        );
        break;

      case 'under_review':
        actions.push(
          {
            action: 'approve',
            label: 'Approve',
            icon: Check,
            color: 'green',
            primary: true
          },
          {
            action: 'reject',
            label: 'Reject',
            icon: X,
            color: 'red'
          },
          {
            action: 'flag',
            label: 'Flag Issue',
            icon: AlertTriangle,
            color: 'orange'
          }
        );
        break;

      case 'approved':
        actions.push(
          {
            action: 'revoke',
            label: 'Revoke Approval',
            icon: X,
            color: 'red',
            primary: true
          },
          {
            action: 'add_note',
            label: 'Add Note',
            icon: FileText,
            color: 'blue'
          }
        );
        break;

      case 'rejected':
        actions.push(
          {
            action: 'reconsider',
            label: 'Reconsider',
            icon: ArrowUp,
            color: 'blue',
            primary: true
          },
          {
            action: 'add_note',
            label: 'Add Note',
            icon: FileText,
            color: 'gray'
          }
        );
        break;

      default:
        // No actions available for other statuses
        break;
    }

    return actions;
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

    // Define actions that require confirmation
    const requiresConfirmation = ['reject', 'revoke', 'escalate'];
    const requiresReason = ['reject', 'revoke', 'request_info'];

    if (requiresConfirmation.includes(action)) {
      const actionLabels: Record<string, string> = {
        reject: 'Reject Application',
        revoke: 'Revoke Approval', 
        escalate: 'Escalate Application',
        request_info: 'Request Information'
      };

      const actionMessages: Record<string, string> = {
        reject: 'Are you sure you want to reject this application? This action cannot be undone.',
        revoke: 'Are you sure you want to revoke this approval? The contractor will be notified.',
        escalate: 'This application will be escalated to a senior reviewer.',
        request_info: 'Additional information will be requested from the contractor.'
      };

      setConfirmation({
        isOpen: true,
        action,
        title: actionLabels[action] || 'Confirm Action',
        message: actionMessages[action] || 'Are you sure you want to proceed?',
        requiresReason: requiresReason.includes(action),
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
      const actionLabels: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected', 
        revoke: 'revoked',
        escalate: 'escalated',
        request_info: 'updated - information requested',
        flag: 'flagged for review',
        add_note: 'updated with note',
        reconsider: 'marked for reconsideration'
      };

      toast.success(`Application ${actionLabels[action] || 'updated'} successfully`);
      
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

// Hook for bulk application actions
interface UseBulkApplicationActionsProps {
  selectedContractorIds: string[];
  onActionComplete?: () => void;
}

interface UseBulkApplicationActionsReturn {
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

export function useBulkApplicationActions({
  selectedContractorIds,
  onActionComplete
}: UseBulkApplicationActionsProps): UseBulkApplicationActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false });

  const handleBulkAction = useCallback((action: 'approve' | 'reject') => {
    const actionMessages = {
      approve: `Are you sure you want to approve ${selectedContractorIds.length} applications?`,
      reject: `Are you sure you want to reject ${selectedContractorIds.length} applications?`
    };

    setConfirmation({
      isOpen: true,
      action: action as ApprovalAction,
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)} Applications`,
      message: actionMessages[action],
      requiresReason: action === 'reject',
      reason: '',
      notes: ''
    });
  }, [selectedContractorIds]);

  const executeBulkAction = useCallback(async (
    action: 'approve' | 'reject',
    reason?: string,
    notes?: string
  ) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual bulk service call
      // const result = await contractorService.bulkAction({
      //   contractorIds: selectedContractorIds,
      //   action,
      //   reason,
      //   notes
      // });

      // Mock bulk action for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      log.info('Bulk application action executed:', {
        contractorIds: selectedContractorIds,
        action,
        reason,
        notes
      }, 'useBulkApplicationActions');

      toast.success(`${selectedContractorIds.length} applications ${action}d successfully`);
      
      setConfirmation({ isOpen: false });
      onActionComplete?.();

    } catch (error) {
      log.error('Failed to execute bulk action:', {
        data: error,
        contractorIds: selectedContractorIds,
        action
      }, 'useBulkApplicationActions');

      toast.error('Failed to process bulk action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedContractorIds, onActionComplete]);

  return {
    isLoading,
    confirmation,
    actions: {
      setConfirmation,
      handleBulkAction,
      executeBulkAction
    }
  };
}