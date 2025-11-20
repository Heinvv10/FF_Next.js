// Approval control buttons component

'use client';

import React from 'react';

interface ApprovalControlsProps {
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ApprovalControls({
  onApprove,
  onEdit,
  onReject,
  loading = false,
  disabled = false,
}: ApprovalControlsProps) {
  return (
    <div className="flex gap-3 justify-end">
      <button
        onClick={onReject}
        disabled={loading || disabled}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Reject
      </button>
      <button
        onClick={onEdit}
        disabled={loading || disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Edit & Approve
      </button>
      <button
        onClick={onApprove}
        disabled={loading || disabled}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : 'Approve & Send'}
      </button>
    </div>
  );
}
