// ============= PO Detail Header Component =============
// Modal header with title, badges, and action buttons

import React from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Send,
  Edit,
  Download
} from 'lucide-react';
import { VelocityButton, StatusBadge } from '../../../../components/ui';
import type { PurchaseOrder, POStatus } from '../../../../types/procurement/po.types';

interface PODetailHeaderProps {
  po: PurchaseOrder;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
  onStatusChange: (status: POStatus) => void;
  onClose: () => void;
}

export const PODetailHeader: React.FC<PODetailHeaderProps> = ({
  po,
  actionLoading,
  onApprove,
  onReject,
  onStatusChange,
  onClose
}) => {
  const canApprove = po.approvalStatus === 'PENDING' || po.approvalStatus === 'IN_PROGRESS';
  const canEdit = po.status === 'DRAFT';
  const canSend = po.status === 'APPROVED';

  return (
    <div className="flex items-center justify-between p-6 border-b">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{po.poNumber}</h2>
        <p className="text-gray-600">{po.title}</p>
        <div className="flex items-center space-x-3 mt-2">
          <StatusBadge status={po.status} />
          <StatusBadge status={po.approvalStatus} />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Approval Actions */}
        {canApprove && (
          <>
            <VelocityButton
              size="sm"
              onClick={onApprove}
              loading={actionLoading === 'approve'}
              icon={<CheckCircle className="h-4 w-4" />}
            >
              Approve
            </VelocityButton>
            <VelocityButton
              variant="outline"
              size="sm"
              onClick={onReject}
              loading={actionLoading === 'reject'}
              icon={<AlertCircle className="h-4 w-4" />}
            >
              Reject
            </VelocityButton>
          </>
        )}

        {/* Send Action */}
        {canSend && (
          <VelocityButton
            size="sm"
            onClick={() => onStatusChange('SENT' as any)}
            loading={actionLoading === 'status'}
            icon={<Send className="h-4 w-4" />}
          >
            Send to Supplier
          </VelocityButton>
        )}

        {/* Edit Action */}
        {canEdit && (
          <VelocityButton
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
          >
            Edit
          </VelocityButton>
        )}

        {/* Download Action */}
        <VelocityButton
          variant="outline"
          size="sm"
          icon={<Download className="h-4 w-4" />}
        >
          Download PDF
        </VelocityButton>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
