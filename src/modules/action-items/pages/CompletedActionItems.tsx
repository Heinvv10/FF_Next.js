'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { ActionItem } from '@/types/action-items.types';
import { actionItemsService } from '@/services/action-items/actionItemsService';
import { ActionItemsList } from '../components/ActionItemsList';

export function CompletedActionItems() {
  const router = useRouter();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await actionItemsService.getActionItems({ status: 'completed' });
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/action-items')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Completed Action Items</h1>
            <p className="text-gray-600 mt-1">Successfully completed items</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800">
          <span className="font-semibold">{items.length}</span> completed action items
        </p>
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && <ActionItemsList items={items} onItemUpdated={fetchItems} />}
    </div>
  );
}
