// src/modules/ticketing/components/SLAStatusBadge.tsx
// SLA status indicator with breach warnings
'use client';

import React from 'react';

interface SLAStatusBadgeProps {
  deadline: Date | string | null;
  breached?: boolean;
  paused?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SLAStatusBadge({ deadline, breached = false, paused = false, size = 'md' }: SLAStatusBadgeProps) {
  if (!deadline) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
        No SLA
      </span>
    );
  }

  if (paused) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
        ⏸️ Paused
      </span>
    );
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const timeRemaining = deadlineDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // Breached
  if (breached || timeRemaining < 0) {
    return (
      <span className={`inline-flex items-center font-semibold bg-red-100 text-red-800 rounded-full ${sizeClasses[size]}`}>
        🚨 Breached {Math.abs(hoursRemaining)}h ago
      </span>
    );
  }

  // At risk (< 2 hours remaining)
  if (hoursRemaining < 2) {
    return (
      <span className={`inline-flex items-center font-semibold bg-orange-100 text-orange-800 rounded-full ${sizeClasses[size]}`}>
        ⚠️ {hoursRemaining}h {minutesRemaining}m left
      </span>
    );
  }

  // On track
  if (hoursRemaining < 24) {
    return (
      <span className={`inline-flex items-center font-semibold bg-yellow-100 text-yellow-800 rounded-full ${sizeClasses[size]}`}>
        ⏱️ {hoursRemaining}h {minutesRemaining}m left
      </span>
    );
  }

  // Safe (> 24 hours)
  const daysRemaining = Math.floor(hoursRemaining / 24);
  return (
    <span className={`inline-flex items-center font-semibold bg-green-100 text-green-800 rounded-full ${sizeClasses[size]}`}>
      ✓ {daysRemaining}d {hoursRemaining % 24}h left
    </span>
  );
}
