// Review history component showing audit trail

'use client';
import type { ApprovalHistoryEntry } from '../types/fotoReviews.types';

interface ReviewHistoryProps {
  history: ApprovalHistoryEntry[];
  loading?: boolean;
}

export function ReviewHistory({ history, loading = false }: ReviewHistoryProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No history available
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      edited: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-800'}`}>
        {action.toUpperCase()}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review History</h3>
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getActionBadge(entry.action)}
                  <span className="text-sm font-medium">{entry.user_name || 'System'}</span>
                </div>
                {entry.notes && (
                  <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(entry.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
