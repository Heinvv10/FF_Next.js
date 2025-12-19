// src/modules/ticketing/components/SourceBadge.tsx
// Reusable source badge component with color coding
'use client';

import React from 'react';
import type { TicketSource } from '../types';

interface SourceBadgeProps {
  source: TicketSource;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function SourceBadge({ source, size = 'md', showIcon = false }: SourceBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const colorClasses: Record<TicketSource, string> = {
    qcontact: 'bg-blue-100 text-blue-800',
    whatsapp_inbound: 'bg-green-100 text-green-800',
    email: 'bg-purple-100 text-purple-800',
    construction: 'bg-orange-100 text-orange-800',
    internal: 'bg-gray-100 text-gray-800',
    whatsapp_outbound: 'bg-teal-100 text-teal-800',
    adhoc: 'bg-pink-100 text-pink-800',
  };

  const displayText: Record<TicketSource, string> = {
    qcontact: 'QContact',
    whatsapp_inbound: 'WhatsApp Inbound',
    email: 'Email',
    construction: 'Construction',
    internal: 'Internal',
    whatsapp_outbound: 'WhatsApp Outbound',
    adhoc: 'Ad-hoc',
  };

  const icons: Record<TicketSource, string> = {
    qcontact: '📞',
    whatsapp_inbound: '💬',
    email: '📧',
    construction: '🏗️',
    internal: '🏢',
    whatsapp_outbound: '📤',
    adhoc: '✨',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]} ${colorClasses[source]}`}>
      {showIcon && <span className="mr-1">{icons[source]}</span>}
      {displayText[source]}
    </span>
  );
}
