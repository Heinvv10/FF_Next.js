// src/modules/ticketing/components/TicketList.tsx
// Reusable ticket list component with table and card views
'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SourceBadge } from './SourceBadge';
import { SLAStatusBadge } from './SLAStatusBadge';
import type { Ticket } from '../types';

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
  viewMode?: 'table' | 'cards';
  onTicketClick?: (ticketId: string) => void;
  emptyMessage?: string;
}

export function TicketList({
  tickets,
  loading = false,
  viewMode = 'table',
  onTicketClick,
  emptyMessage = 'No tickets found',
}: TicketListProps) {
  function handleTicketClick(ticketId: string) {
    if (onTicketClick) {
      onTicketClick(ticketId);
    } else {
      window.location.href = `/ticketing/${ticketId}`;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => handleTicketClick(ticket.id)}
                className="hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {ticket.ticket_uid}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                  {ticket.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={ticket.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SourceBadge source={ticket.source} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SLAStatusBadge
                    deadline={ticket.sla_response_deadline}
                    breached={ticket.sla_response_breached}
                    paused={ticket.sla_paused}
                    size="sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Card View
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => handleTicketClick(ticket.id)}
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer transition"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-blue-600">{ticket.ticket_uid}</p>
              <h3 className="text-base font-semibold text-gray-900 mt-1 line-clamp-2">
                {ticket.title}
              </h3>
            </div>
            <PriorityBadge priority={ticket.priority} size="sm" />
          </div>

          {/* Description Preview */}
          {ticket.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {ticket.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={ticket.status} size="sm" />
            <SourceBadge source={ticket.source} size="sm" />
          </div>

          {/* SLA Status */}
          {ticket.sla_response_deadline && (
            <div className="mb-3">
              <SLAStatusBadge
                deadline={ticket.sla_response_deadline}
                breached={ticket.sla_response_breached}
                paused={ticket.sla_paused}
                size="sm"
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
            {ticket.assigned_to_name && (
              <span className="flex items-center">
                <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 mr-1">
                  {ticket.assigned_to_name.charAt(0).toUpperCase()}
                </span>
                {ticket.assigned_to_name}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
