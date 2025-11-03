/**
 * RAG Status Badge Component
 * Reusable badge for displaying RAG (Red/Amber/Green) status
 *
 * Usage:
 *   <RagStatusBadge status="green" />
 *   <RagStatusBadge status="amber" size="lg" showIcon />
 */

'use client';

import type { RagStatus } from '../types/rag.types';
import { RAG_STATUS_CONFIG } from '../types/rag.types';

interface RagStatusBadgeProps {
  status: RagStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function RagStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = '',
}: RagStatusBadgeProps) {
  const config = RAG_STATUS_CONFIG[status];

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
