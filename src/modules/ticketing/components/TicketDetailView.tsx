// src/modules/ticketing/components/TicketDetailView.tsx
// Detailed view for a single ticket with timeline, notes, and actions
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type {
  Ticket,
  TicketHistory,
  TicketNote,
  TicketAttachment,
  BillableCalculation
} from '../types';

interface TicketDetailViewProps {
  ticketId: string;
}

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [billing, setBilling] = useState<BillableCalculation | null>(null);

  // Action modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showBillingApprovalModal, setShowBillingApprovalModal] = useState(false);

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  async function loadTicketData() {
    try {
      setLoading(true);

      // Fetch ticket details
      const ticketRes = await fetch(`/api/ticketing/tickets/${ticketId}`);
      const ticketData = await ticketRes.json();
      setTicket(ticketData.data);

      // Fetch history
      const historyRes = await fetch(`/api/ticketing/tickets/${ticketId}/history`);
      const historyData = await historyRes.json();
      setHistory(historyData.data || []);

      // Fetch notes
      const notesRes = await fetch(`/api/ticketing/tickets/${ticketId}/notes`);
      const notesData = await notesRes.json();
      setNotes(notesData.data || []);

      // Fetch attachments
      const attachmentsRes = await fetch(`/api/ticketing/tickets/${ticketId}/attachments`);
      const attachmentsData = await attachmentsRes.json();
      setAttachments(attachmentsData.data || []);

      // Fetch billing if exists
      if (ticketData.data.billing_id) {
        const billingRes = await fetch(`/api/ticketing/billing-calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: ticketData.data.project_id,
            ticket_type: ticketData.data.ticket_type,
            priority: ticketData.data.priority,
            dr_number: ticketData.data.dr_number,
          }),
        });
        const billingData = await billingRes.json();
        setBilling(billingData.data);
      }
    } catch (error) {
      console.error('Failed to load ticket data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    try {
      const res = await fetch(`/api/ticketing/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        setShowStatusModal(false);
        loadTicketData(); // Reload data
      } else {
        alert(`Failed to update status: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('An error occurred while updating status');
    }
  }

  async function handleAssignment(assignedTo: string) {
    try {
      const res = await fetch(`/api/ticketing/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedTo }),
      });

      const data = await res.json();

      if (data.success) {
        setShowAssignModal(false);
        loadTicketData();
      } else {
        alert(`Failed to assign ticket: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      alert('An error occurred while assigning ticket');
    }
  }

  async function handleAddNote(content: string, isInternal: boolean) {
    try {
      const res = await fetch(`/api/ticketing/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, is_internal: isInternal }),
      });

      const data = await res.json();

      if (data.success) {
        setShowNoteModal(false);
        loadTicketData();
      } else {
        alert(`Failed to add note: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('An error occurred while adding note');
    }
  }

  async function handleBillingApproval(approved: boolean, notes?: string) {
    try {
      const res = await fetch(`/api/ticketing/billing-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          approved,
          approval_notes: notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowBillingApprovalModal(false);
        loadTicketData();
      } else {
        alert(`Failed to approve billing: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to approve billing:', error);
      alert('An error occurred while approving billing');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_uid}</h1>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-2">{ticket.title}</h2>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Update Status
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Assign
            </button>
            {billing && billing.requires_approval && !ticket.billing_approved && (
              <button
                onClick={() => setShowBillingApprovalModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Approve Billing
              </button>
            )}
          </div>
        </div>

        {/* Ticket Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">Source</p>
            <p className="text-sm font-semibold text-gray-900">{ticket.source.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-sm font-semibold text-gray-900">{ticket.ticket_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Updated</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(ticket.updated_at).toLocaleString()}
            </p>
          </div>
          {ticket.dr_number && (
            <div>
              <p className="text-sm text-gray-500">DR Number</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.dr_number}</p>
            </div>
          )}
          {ticket.category && (
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.category}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {/* Billing Information */}
        {billing && (
          <div className="mt-6">
            <div className={`p-4 rounded-lg border ${
              billing.billing_type === 'guarantee'
                ? 'bg-green-50 border-green-200'
                : billing.billing_type === 'sla'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <h3 className="text-sm font-semibold mb-2">
                Billing Type: {billing.billing_type.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-700 mb-2">{billing.reason}</p>
              {billing.estimated_cost !== null && (
                <p className="text-lg font-bold">
                  Estimated Cost: R{billing.estimated_cost.toFixed(2)}
                </p>
              )}
              {billing.requires_approval && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ Requires billing approval before work can begin
                </p>
              )}
              {ticket.billing_approved && (
                <p className="text-sm text-green-700 mt-2">
                  ✓ Billing approved on {new Date(ticket.billing_approved_at!).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SLA Information */}
        {ticket.sla_response_deadline && (
          <div className="mt-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold mb-2">SLA Deadlines</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Response Due</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(ticket.sla_response_deadline).toLocaleString()}
                  </p>
                </div>
                {ticket.sla_resolution_deadline && (
                  <div>
                    <p className="text-xs text-gray-500">Resolution Due</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(ticket.sla_resolution_deadline).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {ticket.sla_paused && (
                <p className="text-sm text-orange-600 mt-2">
                  ⏸️ SLA timer paused (awaiting customer response)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 border-l-2 border-gray-200 pl-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.change_type}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleString()} by {item.changed_by_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notes & Comments</h3>
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Note
          </button>
        </div>
        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className={`p-4 rounded-lg border ${
                note.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
              }`}>
                {note.is_internal && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded mb-2">
                    Internal Note
                  </span>
                )}
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(note.created_at).toLocaleString()} by {note.created_by_name}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
          <button
            onClick={() => setShowAttachmentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload File
          </button>
        </div>
        <div className="space-y-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No attachments</p>
          ) : (
            attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(attachment.uploaded_at).toLocaleString()} by {attachment.uploaded_by_name}
                  </p>
                </div>
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals would go here - simplified for now */}
      {/* StatusUpdateModal, AssignmentModal, AddNoteModal, AttachmentUploadModal, BillingApprovalModal */}
    </div>
  );
}
