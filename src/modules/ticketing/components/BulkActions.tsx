// src/modules/ticketing/components/BulkActions.tsx
// Bulk actions toolbar for performing actions on multiple tickets
'use client';

import React, { useState } from 'react';
import type { TicketStatus, TicketPriority } from '../types';

interface BulkActionsProps {
  selectedTicketIds: string[];
  onClearSelection: () => void;
  onActionComplete?: () => void;
}

export function BulkActions({
  selectedTicketIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const selectedCount = selectedTicketIds.length;

  async function handleBulkStatusUpdate(newStatus: TicketStatus) {
    if (!confirm(`Update status to "${newStatus}" for ${selectedCount} ticket(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      setCurrentAction(`Updating status to ${newStatus}`);

      const res = await fetch('/api/ticketing/bulk-actions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: selectedTicketIds,
          new_status: newStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully updated ${data.updated_count || selectedCount} ticket(s)`);
        onClearSelection();
        if (onActionComplete) onActionComplete();
      } else {
        alert(`Failed to update tickets: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to update tickets:', error);
      alert('An error occurred while updating tickets');
    } finally {
      setLoading(false);
      setCurrentAction(null);
      setShowActions(false);
    }
  }

  async function handleBulkPriorityUpdate(newPriority: TicketPriority) {
    if (!confirm(`Update priority to "${newPriority}" for ${selectedCount} ticket(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      setCurrentAction(`Updating priority to ${newPriority}`);

      const res = await fetch('/api/ticketing/bulk-actions/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: selectedTicketIds,
          new_priority: newPriority,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully updated ${data.updated_count || selectedCount} ticket(s)`);
        onClearSelection();
        if (onActionComplete) onActionComplete();
      } else {
        alert(`Failed to update tickets: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to update tickets:', error);
      alert('An error occurred while updating tickets');
    } finally {
      setLoading(false);
      setCurrentAction(null);
      setShowActions(false);
    }
  }

  async function handleBulkAssign(assignedTo: string) {
    if (!confirm(`Assign ${selectedCount} ticket(s) to the selected user?`)) {
      return;
    }

    try {
      setLoading(true);
      setCurrentAction('Assigning tickets');

      const res = await fetch('/api/ticketing/bulk-actions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: selectedTicketIds,
          assigned_to: assignedTo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully assigned ${data.updated_count || selectedCount} ticket(s)`);
        onClearSelection();
        if (onActionComplete) onActionComplete();
      } else {
        alert(`Failed to assign tickets: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to assign tickets:', error);
      alert('An error occurred while assigning tickets');
    } finally {
      setLoading(false);
      setCurrentAction(null);
      setShowActions(false);
    }
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `⚠️ WARNING: Delete ${selectedCount} ticket(s) permanently? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setCurrentAction('Deleting tickets');

      const res = await fetch('/api/ticketing/bulk-actions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: selectedTicketIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully deleted ${data.deleted_count || selectedCount} ticket(s)`);
        onClearSelection();
        if (onActionComplete) onActionComplete();
      } else {
        alert(`Failed to delete tickets: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete tickets:', error);
      alert('An error occurred while deleting tickets');
    } finally {
      setLoading(false);
      setCurrentAction(null);
      setShowActions(false);
    }
  }

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Selection Count */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              {selectedCount} ticket{selectedCount > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-100 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span className="text-sm">{currentAction}...</span>
              </div>
            ) : (
              <>
                {/* Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium flex items-center space-x-1"
                  >
                    <span>Actions</span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showActions && (
                    <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-900">
                      {/* Update Status */}
                      <div className="p-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">
                          Update Status
                        </p>
                        {(['open', 'in_progress', 'awaiting_customer', 'resolved', 'closed'] as TicketStatus[]).map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() => handleBulkStatusUpdate(status)}
                              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded capitalize"
                            >
                              {status.replace('_', ' ')}
                            </button>
                          )
                        )}
                      </div>

                      {/* Update Priority */}
                      <div className="p-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">
                          Update Priority
                        </p>
                        {(['critical', 'high', 'medium', 'low'] as TicketPriority[]).map(
                          (priority) => (
                            <button
                              key={priority}
                              onClick={() => handleBulkPriorityUpdate(priority)}
                              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded capitalize"
                            >
                              {priority}
                            </button>
                          )
                        )}
                      </div>

                      {/* Danger Zone */}
                      <div className="p-2">
                        <button
                          onClick={handleBulkDelete}
                          className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          🗑️ Delete Selected
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Button (integrated here) */}
                <button
                  onClick={() => {
                    const url = `/api/ticketing/export?ticket_ids=${selectedTicketIds.join(',')}`;
                    window.open(url, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm font-medium"
                >
                  📥 Export Selected
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
