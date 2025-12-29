/**
 * TicketHeader Component - Ticket detail header
 *
 * 🟢 WORKING: Production-ready ticket header component
 *
 * Features:
 * - Display ticket UID, title, status, priority
 * - QA ready indicator
 * - SLA breach warning
 * - Creation and update timestamps
 * - Assigned user display
 * - Back navigation button
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TicketStatusBadge } from '../TicketList/TicketStatusBadge';
import type { Ticket } from '../../types/ticket';

interface TicketHeaderProps {
  /** Ticket data */
  ticket: Ticket;
  /** Back link URL */
  backLink?: string;
}

/**
 * 🟢 WORKING: Get priority badge styling
 */
function getPriorityBadgeStyle(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-600/20 text-red-500 border-red-600/30',
  };

  return priorityColors[priority] || priorityColors.normal;
}

/**
 * 🟢 WORKING: Ticket header component
 */
export function TicketHeader({ ticket, backLink = '/ticketing/tickets' }: TicketHeaderProps) {
  return (
    <div className="bg-[var(--ff-bg-secondary)] border border-[var(--ff-border-light)] rounded-lg p-6">
      {/* Back Button */}
      <Link
        href={backLink}
        className="inline-flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      {/* Ticket UID and Badges */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ff-text-primary)] mb-2">{ticket.ticket_uid}</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <TicketStatusBadge status={ticket.status} showIcon />

            {/* Priority Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border uppercase',
                getPriorityBadgeStyle(ticket.priority)
              )}
            >
              {ticket.priority}
            </span>

            {/* QA Ready Indicator */}
            {ticket.qa_ready && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                QA Ready
              </span>
            )}

            {/* SLA Breach Warning */}
            {ticket.sla_breached && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                SLA Breached
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-[var(--ff-text-primary)] mb-4">{ticket.title}</h2>

      {/* Meta Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[var(--ff-border-light)]">
        {/* Created */}
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] mb-1">
            <Clock className="w-4 h-4" />
            Created
          </div>
          <p className="text-sm text-[var(--ff-text-primary)]">
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Updated */}
        {ticket.updated_at && (
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] mb-1">
              <Clock className="w-4 h-4" />
              Updated
            </div>
            <p className="text-sm text-[var(--ff-text-primary)]">
              {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
            </p>
          </div>
        )}

        {/* Assigned To */}
        {ticket.assigned_to && (
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] mb-1">
              <User className="w-4 h-4" />
              Assigned To
            </div>
            <p className="text-sm text-[var(--ff-text-primary)]">Assigned</p>
          </div>
        )}

        {/* DR Number */}
        {ticket.dr_number && (
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--ff-text-secondary)] mb-1">
              <MapPin className="w-4 h-4" />
              DR Number
            </div>
            <p className="text-sm text-[var(--ff-text-primary)] font-mono">{ticket.dr_number}</p>
          </div>
        )}
      </div>
    </div>
  );
}
