// ============= PO Actions Hook =============
// Handles user actions for purchase orders

import { useState } from 'react';
import type { PurchaseOrder, POStatus } from '../../../../types/procurement/po.types';
import { poService } from '../../../../services/procurement/poService';

interface UsePOActionsProps {
  po: PurchaseOrder | null;
  onUpdated: () => void;
  onReload: () => Promise<void>;
}

export const usePOActions = ({ po, onUpdated, onReload }: UsePOActionsProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: POStatus, notes?: string) => {
    if (!po) return;

    try {
      setActionLoading('status');
      await poService.updatePOStatus(po.id, newStatus, notes);
      await onReload();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!po) return;

    try {
      setActionLoading('approve');
      await poService.approvePO(po.id, 'current-user');
      await onReload();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve purchase order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!po) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading('reject');
      await poService.rejectPO(po.id, 'current-user', reason);
      await onReload();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject purchase order');
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    error,
    handleStatusChange,
    handleApprove,
    handleReject
  };
};
