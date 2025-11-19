// ============= PO Data Hook =============
// Handles data fetching for purchase order details

import { useState, useEffect } from 'react';
import type { PurchaseOrder, POItem } from '../../../../types/procurement/po.types';
import { poService } from '../../../../services/procurement/poService';

export const usePOData = (poId: string) => {
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPOData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [poData, itemsData] = await Promise.all([
        poService.getPOById(poId),
        poService.getPOItems(poId)
      ]);

      if (!poData) {
        throw new Error('Purchase Order not found');
      }

      setPO(poData);
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOData();
  }, [poId]);

  return {
    po,
    items,
    loading,
    error,
    reload: loadPOData
  };
};
