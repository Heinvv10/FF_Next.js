/**
 * Status Badge Component
 * Displays rate card status with appropriate styling and icon
 * @module RateCardManagement
 */

import React from 'react';
import { Clock, CheckCircle, Archive } from 'lucide-react';
import { StatusBadgeProps } from '../types/rateCardManagement.types';

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeStyles = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const icons = {
    draft: Clock,
    active: CheckCircle,
    archived: Archive
  };

  const IconComponent = icons[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status]}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}