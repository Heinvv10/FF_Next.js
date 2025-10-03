/**
 * Approval Badge Component
 * Displays rate card approval status with appropriate styling and icon
 * @module RateCardManagement
 */

import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { ApprovalBadgeProps } from '../types/rateCardManagement.types';

export function ApprovalBadge({ status }: ApprovalBadgeProps) {
  const badgeStyles = {
    pending: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const icons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: AlertTriangle
  };

  const IconComponent = icons[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status]}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}