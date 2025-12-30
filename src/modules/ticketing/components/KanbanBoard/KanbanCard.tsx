'use client';

/**
 * KanbanCard Component
 *
 * Draggable ticket card for the Kanban board.
 * Shows ticket summary with priority badge and key info.
 */

import { useRouter } from 'next/navigation';
import type { Ticket } from '../../types/ticket';
import { TicketPriority } from '../../types/ticket';

interface KanbanCardProps {
  ticket: Ticket;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const priorityColors: Record<TicketPriority, { bg: string; text: string; border: string }> = {
  [TicketPriority.CRITICAL]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  [TicketPriority.URGENT]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  [TicketPriority.HIGH]: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  [TicketPriority.NORMAL]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  [TicketPriority.LOW]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
};

export function KanbanCard({ ticket, isDragging, onDragStart, onDragEnd }: KanbanCardProps) {
  const router = useRouter();
  const priorityStyle = priorityColors[ticket.priority] || priorityColors[TicketPriority.NORMAL];

  const handleClick = () => {
    router.push(`/ticketing/tickets/${ticket.id}`);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticket.id);
    onDragStart?.(e, ticket.id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    onDragEnd?.(e);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group p-3 bg-[var(--ff-card-bg)] rounded-lg border border-[var(--ff-border)]
        cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-blue-400
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95 shadow-lg' : ''}
      `}
    >
      {/* Header: UID and Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--ff-text-secondary)]">
          {ticket.ticket_uid}
        </span>
        <span className={`
          px-2 py-0.5 text-xs font-medium rounded-full
          ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}
        `}>
          {ticket.priority.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-[var(--ff-text-primary)] mb-2 line-clamp-2 group-hover:text-blue-600">
        {ticket.title}
      </h4>

      {/* DR Number if present */}
      {ticket.dr_number && (
        <div className="flex items-center gap-1 mb-2">
          <svg className="w-3 h-3 text-[var(--ff-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-[var(--ff-text-secondary)]">{ticket.dr_number}</span>
        </div>
      )}

      {/* Footer: Assignee and Time */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--ff-border)]">
        <div className="flex items-center gap-1">
          {ticket.assigned_to ? (
            <>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {(ticket as any).assigned_user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-xs text-[var(--ff-text-secondary)] truncate max-w-[80px]">
                {(ticket as any).assigned_user?.name || 'Assigned'}
              </span>
            </>
          ) : (
            <span className="text-xs text-[var(--ff-text-muted)] italic">Unassigned</span>
          )}
        </div>
        <span className="text-xs text-[var(--ff-text-muted)]">
          {formatRelativeTime(ticket.created_at)}
        </span>
      </div>

      {/* QA Ready indicator */}
      {ticket.qa_ready && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-600 font-medium">QA Ready</span>
        </div>
      )}

      {/* SLA Breached warning */}
      {ticket.sla_breached && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs text-red-600 font-medium">SLA Breached</span>
        </div>
      )}
    </div>
  );
}
