/**
 * Drop Status Badge Component
 * Reusable badge for displaying drop status (incomplete/complete)
 *
 * Usage:
 *   <DropStatusBadge status="complete" />
 *   <DropStatusBadge status="incomplete" size="lg" showIcon />
 */

'use client';

import type { DropStatus } from '../types/wa-monitor.types';
import { DROP_STATUS_CONFIG } from '../types/wa-monitor.types';

interface DropStatusBadgeProps {
  status: DropStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function DropStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = '',
}: DropStatusBadgeProps) {
  const config = DROP_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}
      title={config.description}
    >
      {showIcon && <span>{config.emoji}</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
