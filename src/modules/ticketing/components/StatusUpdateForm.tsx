// src/modules/ticketing/components/StatusUpdateForm.tsx
// Form for updating ticket status with validation and notes
'use client';

import React, { useState } from 'react';

interface StatusUpdateFormProps {
  ticketId: string;
  currentStatus: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StatusUpdateForm({
  ticketId,
  currentStatus,
  onSuccess,
  onCancel,
}: StatusUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'open', label: 'Open', description: 'Ticket is new and unassigned' },
    { value: 'in_progress', label: 'In Progress', description: 'Work has started' },
    { value: 'awaiting_customer', label: 'Awaiting Customer', description: 'Waiting for customer response (pauses SLA)' },
    { value: 'resolved', label: 'Resolved', description: 'Issue has been fixed' },
    { value: 'closed', label: 'Closed', description: 'Ticket is complete and verified' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newStatus === currentStatus) {
      alert('Please select a different status');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/ticketing/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          alert('Status updated successfully!');
          window.location.reload();
        }
      } else {
        alert(`Failed to update status: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('An error occurred while updating status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Status
        </label>
        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
          {statusOptions.find((opt) => opt.value === currentStatus)?.label || currentStatus}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Status <span className="text-red-500">*</span>
        </label>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {statusOptions.find((opt) => opt.value === newStatus)?.description}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any notes about this status change..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Special Warnings */}
      {newStatus === 'awaiting_customer' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Setting status to "Awaiting Customer" will pause the SLA timer until the customer responds.
          </p>
        </div>
      )}

      {newStatus === 'resolved' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ℹ️ Marking as "Resolved" will stop the SLA timer. Make sure the issue is fully addressed.
          </p>
        </div>
      )}

      {newStatus === 'closed' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-800">
            ✓ Closing the ticket indicates the issue is fully resolved and verified. This action is final.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || newStatus === currentStatus}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
            loading || newStatus === currentStatus ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </form>
  );
}
