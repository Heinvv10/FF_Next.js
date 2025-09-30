/**
 * ApplicationActionButtons - Individual action buttons for applications
 * Handles compact and full button layouts
 * Extracted from ApplicationActions.tsx for constitutional compliance
 */

import React from 'react';
import { Eye, Edit, MoreHorizontal } from 'lucide-react';
import { ApprovalAction } from '@/types/contractor.types';

interface ActionItem {
  action: string;
  label: string;
  icon: any;
  color: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  primary?: boolean;
}

interface ApplicationActionButtonsProps {
  contractorId: string;
  availableActions: ActionItem[];
  isLoading: boolean;
  disabled: boolean;
  compact: boolean;
  showMenu: boolean;
  onAction: (action: ApprovalAction) => void;
  onView?: (contractorId: string) => void;
  onEdit?: (contractorId: string) => void;
  onMenuToggle: (show: boolean) => void;
}

export function ApplicationActionButtons({
  contractorId,
  availableActions,
  isLoading,
  disabled,
  compact,
  showMenu,
  onAction,
  onView,
  onEdit,
  onMenuToggle
}: ApplicationActionButtonsProps) {
  if (compact) {
    const primaryAction = availableActions.find(a => a.primary);
    
    return (
      <div className="flex items-center space-x-1">
        {/* Primary Action Button */}
        {primaryAction && (
          <button
            onClick={() => onAction(primaryAction.action as ApprovalAction)}
            disabled={disabled || isLoading}
            className={`p-1 rounded transition-colors disabled:opacity-50 ${
              primaryAction.color === 'green'
                ? 'text-green-600 hover:bg-green-100'
                : primaryAction.color === 'red'
                ? 'text-red-600 hover:bg-red-100'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
            title={primaryAction.label}
          >
            <primaryAction.icon className="h-4 w-4" />
          </button>
        )}
        
        {/* View Button */}
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
              onClick={() => onMenuToggle(!showMenu)}
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
                      onClick={() => onAction(actionItem.action as ApprovalAction)}
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
                      onMenuToggle(false);
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
    );
  }

  // Full layout
  return (
    <div className="space-y-2">
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2">
        {availableActions.map((actionItem) => {
          const Icon = actionItem.icon;
          return (
            <button
              key={actionItem.action}
              onClick={() => onAction(actionItem.action as ApprovalAction)}
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
            <span>Edit Application</span>
          </button>
        )}
      </div>
    </div>
  );
}