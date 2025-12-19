// src/modules/ticketing/components/TicketTimeline.tsx
// Visual timeline of ticket history with icons and grouping
'use client';

import React from 'react';
import type { TicketHistory } from '../types';

interface TicketTimelineProps {
  history: TicketHistory[];
  compact?: boolean;
}

export function TicketTimeline({ history, compact = false }: TicketTimelineProps) {
  function getChangeIcon(changeType: string): string {
    switch (changeType) {
      case 'created':
        return '🆕';
      case 'status_change':
        return '🔄';
      case 'assignment':
        return '👤';
      case 'priority_change':
        return '⚡';
      case 'note_added':
        return '💬';
      case 'attachment_added':
        return '📎';
      case 'billing_approved':
        return '💰';
      case 'billing_rejected':
        return '❌';
      case 'sla_paused':
        return '⏸️';
      case 'sla_resumed':
        return '▶️';
      case 'sla_breached':
        return '🚨';
      default:
        return '📝';
    }
  }

  function getChangeColor(changeType: string): string {
    switch (changeType) {
      case 'created':
        return 'bg-blue-100 border-blue-300';
      case 'status_change':
        return 'bg-gray-100 border-gray-300';
      case 'assignment':
        return 'bg-purple-100 border-purple-300';
      case 'priority_change':
        return 'bg-orange-100 border-orange-300';
      case 'note_added':
        return 'bg-green-100 border-green-300';
      case 'attachment_added':
        return 'bg-teal-100 border-teal-300';
      case 'billing_approved':
        return 'bg-emerald-100 border-emerald-300';
      case 'billing_rejected':
        return 'bg-red-100 border-red-300';
      case 'sla_paused':
        return 'bg-yellow-100 border-yellow-300';
      case 'sla_resumed':
        return 'bg-green-100 border-green-300';
      case 'sla_breached':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  }

  function formatTimestamp(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">No history yet</p>
      </div>
    );
  }

  // Compact view - just a simple list
  if (compact) {
    return (
      <div className="space-y-2">
        {history.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{getChangeIcon(item.change_type)}</span>
            <span className="flex-1 truncate">{item.description}</span>
            <span className="text-xs text-gray-400">{formatTimestamp(item.created_at)}</span>
          </div>
        ))}
        {history.length > 5 && (
          <p className="text-xs text-gray-400 text-center pt-2">
            +{history.length - 5} more events
          </p>
        )}
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={item.id} className="flex items-start space-x-4">
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getChangeColor(
                item.change_type
              )}`}
            >
              <span className="text-lg">{getChangeIcon(item.change_type)}</span>
            </div>
            {index < history.length - 1 && (
              <div className="w-0.5 h-full min-h-[3rem] bg-gray-200 mt-2" />
            )}
          </div>

          {/* Event Content */}
          <div className="flex-1 pb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {item.change_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(item.created_at)} by {item.changed_by_name}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mt-2">{item.description}</p>

              {/* Metadata */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-1">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500">{key.replace('_', ' ')}:</span>
                        <span className="text-gray-700 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
