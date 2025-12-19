// src/modules/ticketing/components/AssignmentForm.tsx
// Form for assigning tickets to team members
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  active_tickets?: number;
}

interface AssignmentFormProps {
  ticketId: string;
  currentAssignee?: string;
  priority: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AssignmentForm({
  ticketId,
  currentAssignee,
  priority,
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState(currentAssignee || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  async function loadTeamMembers() {
    try {
      setLoadingTeam(true);
      const res = await fetch('/api/users'); // Assuming user list endpoint
      const data = await res.json();
      setTeamMembers(data.data || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUser) {
      alert('Please select a team member to assign');
      return;
    }

    if (selectedUser === currentAssignee) {
      alert('Ticket is already assigned to this user');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/ticketing/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedUser,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          alert('Ticket assigned successfully!');
          window.location.reload();
        }
      } else {
        alert(`Failed to assign ticket: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      alert('An error occurred while assigning ticket');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnassign() {
    if (!confirm('Are you sure you want to unassign this ticket?')) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/ticketing/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          alert('Ticket unassigned successfully!');
          window.location.reload();
        }
      } else {
        alert(`Failed to unassign ticket: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to unassign ticket:', error);
      alert('An error occurred while unassigning ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currentAssignee && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currently Assigned To
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 flex items-center justify-between">
            <span>
              {teamMembers.find((m) => m.id === currentAssignee)?.name || currentAssignee}
            </span>
            <button
              type="button"
              onClick={handleUnassign}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Unassign
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign To <span className="text-red-500">*</span>
        </label>
        {loadingTeam ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select team member</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
                {member.active_tickets !== undefined ? ` - ${member.active_tickets} active tickets` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setSelectedUser(user?.id || '')}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          Assign to Me
        </button>
      </div>

      {priority === 'critical' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            🔴 This is a <strong>CRITICAL</strong> priority ticket. The assignee will be notified immediately via email and SMS.
          </p>
        </div>
      )}

      {priority === 'high' && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm text-orange-800">
            🟠 This is a <strong>HIGH</strong> priority ticket. The assignee will be notified via email.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any notes about this assignment..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
          disabled={loading || !selectedUser || selectedUser === currentAssignee}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
            loading || !selectedUser || selectedUser === currentAssignee ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Assigning...' : 'Assign Ticket'}
        </button>
      </div>
    </form>
  );
}
