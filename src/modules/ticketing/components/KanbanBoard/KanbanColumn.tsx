'use client';

/**
 * KanbanColumn Component
 *
 * A status column in the Kanban board.
 * Acts as a drop zone for dragged ticket cards.
 */

import { useState } from 'react';
import type { Ticket } from '../../types/ticket';
import type { DatabaseStatus } from './KanbanBoard';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: DatabaseStatus;
  tickets: Ticket[];
  onDrop: (ticketId: string, newStatus: DatabaseStatus) => void;
  isUpdating?: boolean;
}

// Status display configuration (matching database values)
const statusConfig: Record<DatabaseStatus, { label: string; color: string; bgColor: string }> = {
  'new': { label: 'New', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  'triaged': { label: 'Triaged', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  'assigned': { label: 'Assigned', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'in_progress': { label: 'In Progress', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'blocked': { label: 'Blocked', color: 'text-red-700', bgColor: 'bg-red-100' },
  'resolved': { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-100' },
  'closed': { label: 'Closed', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  'cancelled': { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50' },
  'pending_approval': { label: 'Pending Approval', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

export function KanbanColumn({ status, tickets, onDrop, isUpdating }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);

  const config = statusConfig[status];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only set false if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const ticketId = e.dataTransfer.getData('text/plain');
    if (ticketId) {
      onDrop(ticketId, status);
    }
  };

  const handleCardDragStart = (_e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    setDraggingTicketId(ticketId);
  };

  const handleCardDragEnd = () => {
    setDraggingTicketId(null);
  };

  return (
    <div
      className={`
        flex flex-col min-w-[280px] max-w-[320px] h-full
        bg-[var(--ff-surface)] rounded-lg border
        transition-all duration-200
        ${isDragOver
          ? 'border-blue-500 border-2 bg-blue-50/30 shadow-lg'
          : 'border-[var(--ff-border)]'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--ff-border)]">
        <div className="flex items-center gap-2">
          <span className={`
            px-2 py-1 text-xs font-semibold rounded-md
            ${config.bgColor} ${config.color}
          `}>
            {config.label}
          </span>
          <span className="text-xs text-[var(--ff-text-muted)] bg-[var(--ff-bg)] px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        {isUpdating && (
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        )}
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tickets.length === 0 ? (
          <div className={`
            flex items-center justify-center h-24
            border-2 border-dashed rounded-lg
            transition-colors duration-200
            ${isDragOver
              ? 'border-blue-400 bg-blue-50/50'
              : 'border-[var(--ff-border)] bg-[var(--ff-bg)]'
            }
          `}>
            <span className="text-sm text-[var(--ff-text-muted)]">
              {isDragOver ? 'Drop here' : 'No tickets'}
            </span>
          </div>
        ) : (
          tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              isDragging={draggingTicketId === ticket.id}
              onDragStart={handleCardDragStart}
              onDragEnd={handleCardDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}
