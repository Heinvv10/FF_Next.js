// src/modules/ticketing/components/PriorityBadge.tsx
// Reusable priority badge component with color coding
'use client';

import React from 'react';

interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PriorityBadge({ priority, size = 'md', showIcon = false }: PriorityBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const colorClasses = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const icons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]} ${colorClasses[priority]}`}>
      {showIcon && <span className="mr-1">{icons[priority]}</span>}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
