'use client';

import { useEffect, useState } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { ActionItem } from '@/types/action-items.types';
import { actionItemsService } from '@/services/action-items/actionItemsService';
import { ActionItemsList } from '../components/ActionItemsList';

export function ActionItemsByMeeting() {
  const router = useRouter();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group items by meeting
  const groupedByMeeting = items.reduce((acc, item) => {
    const meetingId = item.meeting_id?.toString() || 'unknown';
    if (!acc[meetingId]) {
      acc[meetingId] = {
        meeting_title: item.meeting_title || 'Unknown Meeting',
        meeting_date: item.meeting_date,
        items: [],
      };
    }
    acc[meetingId].items.push(item);
    return acc;
  }, {} as Record<string, { meeting_title: string; meeting_date?: string; items: ActionItem[] }>);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await actionItemsService.getActionItems();
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
          <Calendar className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Action Items by Meeting</h1>
            <p className="text-gray-600 mt-1">Grouped by source meeting</p>
          </div>
        </div>
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

      {!loading && !error && (
        <div className="space-y-8">
          {Object.entries(groupedByMeeting).map(([meetingId, group]) => (
            <div key={meetingId}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{group.meeting_title}</h2>
                {group.meeting_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(group.meeting_date).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">{group.items.length} action items</p>
              </div>
              <ActionItemsList items={group.items} onItemUpdated={fetchItems} />
            </div>
          ))}

          {Object.keys(groupedByMeeting).length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No action items found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
