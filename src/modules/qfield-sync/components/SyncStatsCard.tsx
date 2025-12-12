/**
 * Sync Stats Card Component
 * Displays synchronization statistics
 */

import React from 'react';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SyncStats } from '../types/qfield-sync.types';

interface SyncStatsCardProps {
  stats: SyncStats;
}

export function SyncStatsCard({ stats }: SyncStatsCardProps) {
  const successRate = stats.totalSyncs > 0
    ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalSyncs}</p>
          <p className="text-sm text-gray-600">Total Syncs</p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{successRate}%</p>
          <p className="text-sm text-gray-600">Success Rate</p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.averageSyncDuration > 0 ? `${Math.round(stats.averageSyncDuration / 1000)}s` : '-'}
          </p>
          <p className="text-sm text-gray-600">Avg Duration</p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.totalRecordsSynced.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Records Synced</p>
        </div>
      </div>

      {stats.lastSync && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Last Sync:</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(stats.lastSync).toLocaleString()}
            </p>
          </div>
          {stats.nextScheduledSync && (
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">Next Scheduled:</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(stats.nextScheduledSync).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}