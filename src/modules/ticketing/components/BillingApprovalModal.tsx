// src/modules/ticketing/components/BillingApprovalModal.tsx
// Modal for approving or rejecting billable tickets
'use client';

import React, { useState } from 'react';

interface BillingApprovalModalProps {
  ticketId: string;
  ticketTitle: string;
  estimatedCost: number;
  billingDetails: {
    billing_type: string;
    reason: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BillingApprovalModal({
  ticketId,
  ticketTitle,
  estimatedCost,
  billingDetails,
  onSuccess,
  onCancel,
}: BillingApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!decision) {
      alert('Please select approve or reject');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/ticketing/billing-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          approved: decision === 'approve',
          approval_notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          alert(`Billing ${decision === 'approve' ? 'approved' : 'rejected'} successfully!`);
          window.location.reload();
        }
      } else {
        alert(`Failed to ${decision} billing: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to process billing approval:', error);
      alert('An error occurred while processing billing approval');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Billing Approval Required</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve or reject billing for this ticket
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ticket Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Ticket Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ticket:</span>
                  <span className="text-sm font-semibold text-gray-900">{ticketTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Cost:</span>
                  <span className="text-lg font-bold text-orange-600">
                    R{estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Billing Type & Reason */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Billing Justification</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Billing Type:</span>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-800 rounded-full">
                    {billingDetails.billing_type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-800">{billingDetails.reason}</p>
                </div>
              </div>
            </div>

            {/* Decision Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Decision <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDecision('approve')}
                  className={`p-4 rounded-lg border-2 transition ${
                    decision === 'approve'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">✅</span>
                    <p className="font-semibold text-gray-900">Approve</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Allow work to proceed with billing
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`p-4 rounded-lg border-2 transition ${
                    decision === 'reject'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">❌</span>
                    <p className="font-semibold text-gray-900">Reject</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Do not proceed with billable work
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Approval Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Approval Notes {decision === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required={decision === 'reject'}
                placeholder={
                  decision === 'reject'
                    ? 'Please provide a reason for rejection...'
                    : 'Optional notes about this approval...'
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {decision === 'reject' && (
                <p className="text-xs text-red-600 mt-1">
                  Rejection reason is required to inform the team
                </p>
              )}
            </div>

            {/* Warning Messages */}
            {decision === 'approve' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Approving this ticket will allow the team to proceed with billable work.
                  The estimated cost of <strong>R{estimatedCost.toFixed(2)}</strong> will be added to the project billing.
                </p>
              </div>
            )}

            {decision === 'reject' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Rejecting this ticket will prevent the team from proceeding with work.
                  The ticket will remain in pending status until a decision is made.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !decision || (decision === 'reject' && !notes.trim())}
              className={`px-8 py-2 rounded-lg text-white transition ${
                decision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : decision === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
              } ${
                loading || !decision || (decision === 'reject' && !notes.trim())
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {loading
                ? 'Processing...'
                : decision === 'approve'
                ? 'Approve Billing'
                : decision === 'reject'
                ? 'Reject Billing'
                : 'Make Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
