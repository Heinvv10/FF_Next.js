// src/modules/ticketing/components/StatusBadge.tsx
// Reusable status badge component with color coding
'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'awaiting_customer' | 'resolved' | 'closed';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const colorClasses = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    awaiting_customer: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  const displayText = {
    open: 'Open',
    in_progress: 'In Progress',
    awaiting_customer: 'Awaiting Customer',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}>
      {displayText[status]}
    </span>
  );
}
