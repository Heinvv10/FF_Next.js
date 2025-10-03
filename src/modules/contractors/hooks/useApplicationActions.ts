/**
 * Application Actions Hooks - Re-export
 * Refactored for constitutional compliance
 * Original 439-line file split into focused modules
 * @module ApplicationActions
 */

// Re-export from the modularized application actions hooks
export {
  useApplicationActions,
  useBulkApplicationActions,
  type UseApplicationActionsProps,
  type UseApplicationActionsReturn,
  type UseBulkApplicationActionsProps,
  type UseBulkApplicationActionsReturn,
  type ConfirmationState,
  type ActionItem,
  REJECTION_REASONS
} from './application-actions';