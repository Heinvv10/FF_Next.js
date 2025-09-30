/**
 * ApplicationActions Component - Action buttons for application approval/rejection
 * Provides individual and bulk approval actions with confirmation dialogs
 */

import { useState } from 'react';
import { log } from '@/lib/logger';
import { 
  Check, 
  X, 
  MessageCircle, 
  ArrowUp, 
  MoreHorizontal,
  AlertTriangle,
  Eye,
  Edit,
  Send,
  FileText
} from 'lucide-react';
import { 
  ApprovalAction, 
  ApprovalActionResult, 
  BulkApprovalRequest,
  ApplicationStatus 
} from '@/types/contractor.types';

// 🟢 WORKING: Props interface for ApplicationActions
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

// 🟢 WORKING: Props interface for BulkActions
interface BulkApplicationActionsProps {
  /** Selected contractor IDs */
  selectedContractorIds: string[];
  /** Callback for bulk actions */
  onBulkAction?: (request: BulkApprovalRequest) => Promise<ApprovalActionResult[]>;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Callback to clear selection */
  onClearSelection?: () => void;
}

// 🟢 WORKING: Confirmation dialog state
interface ConfirmationDialog {
  isOpen: boolean;
  action?: ApprovalAction;
  contractorId?: string;
  title?: string;
  message?: string;
  requiresReason?: boolean;
  reason?: string;
  notes?: string;
}

/**
 * ApplicationActions Component - Individual contractor action buttons
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
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({ isOpen: false });

  // 🟢 WORKING: Determine available actions based on status
  const getAvailableActions = () => {
    const actions = [];
    
    switch (status) {
      case 'pending':
        actions.push(
          { action: 'approve', label: 'Approve', icon: Check, color: 'green', primary: true },
          { action: 'reject', label: 'Reject', icon: X, color: 'red' },
          { action: 'request_more_info', label: 'Request Info', icon: MessageCircle, color: 'blue' }
        );
        break;
      
      case 'under_review':
        actions.push(
          { action: 'approve', label: 'Approve', icon: Check, color: 'green', primary: true },
          { action: 'reject', label: 'Reject', icon: X, color: 'red' },
          { action: 'escalate', label: 'Escalate', icon: ArrowUp, color: 'orange' }
        );
        break;
      
      case 'documentation_incomplete':
        actions.push(
          { action: 'request_more_info', label: 'Follow Up', icon: MessageCircle, color: 'blue', primary: true },
          { action: 'reject', label: 'Reject', icon: X, color: 'red' }
        );
        break;
      
      default:
        // For approved/rejected, only view action available
        break;
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  // 🟢 WORKING: Handle action execution with confirmation
  const handleAction = async (action: ApprovalAction) => {
    if (!onAction) return;

    // Show confirmation dialog for destructive actions
    if (action === 'reject' || action === 'escalate') {
      setConfirmation({
        isOpen: true,
        action,
        contractorId,
        title: action === 'reject' ? 'Reject Application' : 'Escalate Application',
        message: action === 'reject' 
          ? 'Are you sure you want to reject this application? This action cannot be undone.'
          : 'Escalate this application to senior management for review?',
        requiresReason: true,
        reason: '',
        notes: ''
      });
      return;
    }

    // Execute action directly for non-destructive actions
    await executeAction(action);
  };

  // 🟢 WORKING: Execute the actual action
  const executeAction = async (action: ApprovalAction, reason?: string, notes?: string) => {
    if (!onAction) return;

    setIsLoading(true);
    try {
      const result = await onAction(contractorId, action, { reason, notes });
      if (!result.success) {
        // TODO: Show error toast
        log.error('Action failed:', { data: result.message }, 'ApplicationActions');
      }
    } catch (error) {
      log.error('Action error:', { data: error }, 'ApplicationActions');
    } finally {
      setIsLoading(false);
      setConfirmation({ isOpen: false });
      setShowMenu(false);
    }
  };

  // 🟢 WORKING: Confirmation dialog component
  const ConfirmationModal = () => {
    if (!confirmation.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmation.title}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">{confirmation.message}</p>
          
          {confirmation.requiresReason && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <select
                  value={confirmation.reason || ''}
                  onChange={(e) => setConfirmation({
                    ...confirmation,
                    reason: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason...</option>
                  {confirmation.action === 'reject' && (
                    <>
                      <option value="incomplete_documentation">Incomplete Documentation</option>
                      <option value="insufficient_experience">Insufficient Experience</option>
                      <option value="failed_background_check">Failed Background Check</option>
                      <option value="financial_concerns">Financial Concerns</option>
                      <option value="compliance_issues">Compliance Issues</option>
                      <option value="other">Other</option>
                    </>
                  )}
                  {confirmation.action === 'escalate' && (
                    <>
                      <option value="complex_case">Complex Case</option>
                      <option value="high_value_contractor">High Value Contractor</option>
                      <option value="requires_senior_review">Requires Senior Review</option>
                      <option value="policy_exception">Policy Exception Required</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={confirmation.notes || ''}
                  onChange={(e) => setConfirmation({
                    ...confirmation,
                    notes: e.target.value
                  })}
                  placeholder="Add any additional context..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmation({ isOpen: false })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => executeAction(
                confirmation.action!,
                confirmation.reason,
                confirmation.notes
              )}
              disabled={isLoading || (confirmation.requiresReason && !confirmation.reason)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                confirmation.action === 'reject' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLoading ? 'Processing...' : 
               confirmation.action === 'reject' ? 'Reject Application' : 'Escalate'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🟢 WORKING: Compact mode for table display
  if (compact) {
    return (
      <>
        <div className={`flex items-center space-x-1 ${className}`}>
          {/* Primary action button */}
          {availableActions.find(a => a.primary) && (
            <button
              onClick={() => handleAction(availableActions.find(a => a.primary)!.action as ApprovalAction)}
              disabled={disabled || isLoading}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                availableActions.find(a => a.primary)!.color === 'green' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : availableActions.find(a => a.primary)!.color === 'blue'
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {availableActions.find(a => a.primary)!.label}
            </button>
          )}
          
          {/* View action */}
          {onView && (
            <button
              onClick={() => onView(contractorId)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          
          {/* More actions menu */}
          {(availableActions.length > 1 || onEdit) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="More Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                  {availableActions.filter(a => !a.primary).map((actionItem) => {
                    const Icon = actionItem.icon;
                    return (
                      <button
                        key={actionItem.action}
                        onClick={() => handleAction(actionItem.action as ApprovalAction)}
                        disabled={disabled || isLoading}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{actionItem.label}</span>
                      </button>
                    );
                  })}
                  
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(contractorId);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Application</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <ConfirmationModal />
      </>
    );
  }

  // 🟢 WORKING: Full action buttons layout
  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Primary Actions */}
        <div className="flex flex-wrap gap-2">
          {availableActions.map((actionItem) => {
            const Icon = actionItem.icon;
            return (
              <button
                key={actionItem.action}
                onClick={() => handleAction(actionItem.action as ApprovalAction)}
                disabled={disabled || isLoading}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  actionItem.primary
                    ? actionItem.color === 'green'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    : actionItem.color === 'red'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : actionItem.color === 'orange'
                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{actionItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Actions */}
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(contractorId)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(contractorId)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Progress indicator for incomplete applications */}
        {progress < 100 && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            <span>Application {progress}% complete</span>
          </div>
        )}
      </div>

      <ConfirmationModal />
    </>
  );
}

/**
 * BulkApplicationActions Component - Bulk operations for multiple contractors
 */
export function BulkApplicationActions({
  selectedContractorIds,
  onBulkAction,
  disabled = false,
  onClearSelection
}: BulkApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({ isOpen: false });

  // 🟢 WORKING: Handle bulk action execution
  const handleBulkAction = async (action: ApprovalAction) => {
    if (!onBulkAction || selectedContractorIds.length === 0) return;

    // Show confirmation for destructive actions
    if (action === 'reject') {
      setConfirmation({
        isOpen: true,
        action,
        title: 'Bulk Reject Applications',
        message: `Are you sure you want to reject ${selectedContractorIds.length} application(s)? This action cannot be undone.`,
        requiresReason: true,
        reason: '',
        notes: ''
      });
      return;
    }

    // Execute action directly for non-destructive actions
    await executeBulkAction(action);
  };

  // 🟢 WORKING: Execute bulk action
  const executeBulkAction = async (action: ApprovalAction, reason?: string, notes?: string) => {
    if (!onBulkAction) return;

    setIsLoading(true);
    try {
      const request: BulkApprovalRequest = {
        contractorIds: selectedContractorIds,
        action,
        ...(reason && { reason }),
        ...(notes && { notes }),
        notifyContractors: true
      };
      
      const results = await onBulkAction(request);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      // TODO: Show success/error toast
      log.info(`Bulk action completed: ${successCount} successful, ${failCount} failed`, undefined, 'ApplicationActions');
      
      if (onClearSelection) {
        onClearSelection();
      }
    } catch (error) {
      log.error('Bulk action error:', { data: error }, 'ApplicationActions');
    } finally {
      setIsLoading(false);
      setConfirmation({ isOpen: false });
    }
  };

  if (selectedContractorIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedContractorIds.length} application(s) selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction('approve')}
            disabled={disabled || isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Approve All</span>
          </button>
          
          <button
            onClick={() => handleBulkAction('reject')}
            disabled={disabled || isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span>Reject All</span>
          </button>
          
          <button
            onClick={() => handleBulkAction('request_more_info')}
            disabled={disabled || isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>Request Info</span>
          </button>
          
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmation.title}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">{confirmation.message}</p>
            
            {confirmation.requiresReason && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <select
                    value={confirmation.reason || ''}
                    onChange={(e) => setConfirmation({
                      ...confirmation,
                      reason: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="bulk_review_complete">Bulk Review Complete</option>
                    <option value="policy_change">Policy Change</option>
                    <option value="insufficient_applications">Insufficient Applications</option>
                    <option value="administrative_decision">Administrative Decision</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={confirmation.notes || ''}
                    onChange={(e) => setConfirmation({
                      ...confirmation,
                      notes: e.target.value
                    })}
                    placeholder="Add any additional context..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmation({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => executeBulkAction(
                  confirmation.action!,
                  confirmation.reason,
                  confirmation.notes
                )}
                disabled={isLoading || (confirmation.requiresReason && !confirmation.reason)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : `Reject ${selectedContractorIds.length} Applications`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ApplicationActions;