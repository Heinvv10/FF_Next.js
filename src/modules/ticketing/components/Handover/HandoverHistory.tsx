/**
 * HandoverHistory Component - Display handover timeline
 *
 * 🟢 WORKING: Production-ready handover history component
 *
 * Features:
 * - Chronological timeline of handovers
 * - Expandable snapshot details
 * - Ownership flow visualization
 * - Current owner indicator
 * - Loading and empty states
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HandoverSnapshot } from './HandoverSnapshot';
import type { TicketHandoverHistory } from '../../types/handover';

interface HandoverHistoryProps {
  /** Ticket ID to fetch handover history for */
  ticketId: string;
  /** Show current owner prominently */
  showCurrentOwner?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * 🟢 WORKING: Fetch handover history from API
 */
async function fetchHandoverHistory(ticketId: string): Promise<TicketHandoverHistory> {
  const response = await fetch(`/api/ticketing/tickets/${ticketId}/handover-history`);

  if (!response.ok) {
    throw new Error('Failed to fetch handover history');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 🟢 WORKING: Format handover type for display
 */
function formatHandoverType(type: string): string {
  const typeMap: Record<string, string> = {
    build_to_qa: 'Build → QA',
    qa_to_maintenance: 'QA → Maintenance',
    maintenance_complete: 'Maintenance Complete',
  };
  return typeMap[type] || type;
}

/**
 * 🟢 WORKING: Format owner type for display
 */
function formatOwnerType(type: string | null): string {
  if (!type) return 'Unknown';
  const typeMap: Record<string, string> = {
    build: 'Build Team',
    qa: 'QA Team',
    maintenance: 'Maintenance Team',
  };
  return typeMap[type] || type;
}

/**
 * 🟢 WORKING: Timeline item component
 */
function TimelineItem({
  snapshot,
  isLatest,
  compact,
}: {
  snapshot: any;
  isLatest: boolean;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline connector */}
      {!isLatest && (
        <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-white/10" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-5 h-5 rounded-full border-2',
          isLatest
            ? 'bg-green-500 border-green-400'
            : 'bg-blue-500/20 border-blue-500/40'
        )}
      />

      {/* Content */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-white mb-1">
                {formatHandoverType(snapshot.handover_type)}
              </h4>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(snapshot.handover_at).toLocaleString()}</span>
              </div>
            </div>

            {isLatest && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Current
              </span>
            )}
          </div>

          {/* Ownership Transfer */}
          {(snapshot.from_owner_type || snapshot.to_owner_type) && (
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                {formatOwnerType(snapshot.from_owner_type)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                {formatOwnerType(snapshot.to_owner_type)}
              </span>
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Hide Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show Details</span>
              </>
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-4 border-t border-white/10">
            <HandoverSnapshot snapshot={snapshot} compact={compact} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🟢 WORKING: Main handover history component
 */
export function HandoverHistory({
  ticketId,
  showCurrentOwner = true,
  compact = false,
}: HandoverHistoryProps) {
  // 🟢 WORKING: Query for handover history
  const {
    data: history,
    isLoading,
    isError,
    error,
  } = useQuery<TicketHandoverHistory>({
    queryKey: ['handoverHistory', ticketId],
    queryFn: () => fetchHandoverHistory(ticketId),
  });

  // 🟢 WORKING: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/5 border border-white/10 rounded-lg">
        <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
        <span className="ml-2 text-white/60">Loading handover history...</span>
      </div>
    );
  }

  // 🟢 WORKING: Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <span className="ml-2 text-red-400">
          Failed to load handover history: {error?.message || 'Unknown error'}
        </span>
      </div>
    );
  }

  // 🟢 WORKING: Empty state
  if (!history || history.handovers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-lg">
        <Clock className="w-12 h-12 text-white/40 mb-3" />
        <p className="text-white/60 mb-2">No handovers yet</p>
        <p className="text-sm text-white/40">
          Handover history will appear here once the ticket is handed over
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Handover History</h3>
            <p className="text-sm text-white/60">
              Ticket: <span className="font-mono text-white/80">{history.ticket_uid}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-white/60 mb-1">Total Handovers</div>
            <div className="text-3xl font-bold text-white">{history.total_handovers}</div>
          </div>
        </div>

        {/* Current Owner */}
        {showCurrentOwner && history.current_owner_type && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Current Owner:</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {formatOwnerType(history.current_owner_type)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline
        </h4>

        <div className="relative">
          {/* Reverse array to show newest first */}
          {[...history.handovers].reverse().map((snapshot, index) => (
            <TimelineItem
              key={snapshot.id}
              snapshot={snapshot}
              isLatest={index === 0}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Statistics */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">First Handover</div>
            <div className="text-white/90">
              {new Date(history.handovers[0].handover_at).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Latest Handover</div>
            <div className="text-white/90">
              {new Date(history.handovers[history.handovers.length - 1].handover_at).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Handover Count</div>
            <div className="text-white/90">{history.total_handovers} times</div>
          </div>
        </div>
      )}
    </div>
  );
}
