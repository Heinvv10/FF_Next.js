/**
 * PriorityIndicator - Document priority and status indicators
 * Split from ApprovalActions.tsx to meet constitutional requirements (<200 lines)
 * @module PriorityIndicator
 */

import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';

interface PriorityIndicatorProps {
  /**
   * Document to show priority for
   */
  document: ContractorDocument;
}

/**
 * PriorityIndicator - Render priority and urgency indicators for documents
 */
export function PriorityIndicator({ document }: PriorityIndicatorProps) {
  // Helper function to get priority-based styling
  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return {
          icon: AlertCircle,
          colorClass: 'text-red-600',
          bgClass: 'bg-red-50',
          borderClass: 'border-red-200',
          label: 'HIGH PRIORITY'
        };
      case 'medium':
        return {
          icon: Clock,
          colorClass: 'text-yellow-600', 
          bgClass: 'bg-yellow-50',
          borderClass: 'border-yellow-200',
          label: 'MEDIUM PRIORITY'
        };
      case 'low':
        return {
          icon: Clock,
          colorClass: 'text-blue-600',
          bgClass: 'bg-blue-50', 
          borderClass: 'border-blue-200',
          label: 'LOW PRIORITY'
        };
      default:
        return null;
    }
  };

  // Helper function to check if document is expiring soon
  const getExpiryWarning = () => {
    if (!document.expiryDate) return null;
    
    const expiryDate = new Date(document.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return {
        icon: Clock,
        colorClass: 'text-yellow-600',
        label: `EXPIRING IN ${daysUntilExpiry} DAYS`
      };
    } else if (daysUntilExpiry <= 0) {
      return {
        icon: AlertCircle,
        colorClass: 'text-red-600',
        label: 'EXPIRED'
      };
    }
    
    return null;
  };

  const priorityConfig = getPriorityStyles(document.priority);
  const expiryWarning = getExpiryWarning();

  // If no indicators to show, return null
  if (!priorityConfig && !expiryWarning) {
    return null;
  }

  return (
    <div className="mb-2 space-y-1">
      {/* Priority Indicator */}
      {priorityConfig && (
        <div className={`flex items-center gap-1 text-xs ${priorityConfig.colorClass}`}>
          <priorityConfig.icon className="w-3 h-3" />
          <span>{priorityConfig.label}</span>
        </div>
      )}
      
      {/* Expiry Warning */}
      {expiryWarning && (
        <div className={`flex items-center gap-1 text-xs ${expiryWarning.colorClass}`}>
          <expiryWarning.icon className="w-3 h-3" />
          <span>{expiryWarning.label}</span>
        </div>
      )}
    </div>
  );
}