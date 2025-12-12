/**
 * Sync History Table Component
 * Displays historical sync jobs in a table format
 */

import React from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { SyncJob } from '../types/qfield-sync.types';

interface SyncHistoryTableProps {
  history: SyncJob[];
}

export function SyncHistoryTable({ history }: SyncHistoryTableProps) {
  const getStatusBadge = (status: SyncJob['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      default:
        return null;
    }
  };

  const getDirectionBadge = (direction: SyncJob['direction']) => {
    switch (direction) {
      case 'qfield_to_fibreflow':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            QField <ArrowRight className="h-3 w-3" /> FibreFlow
          </span>
        );
      case 'fibreflow_to_qfield':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            FibreFlow <ArrowRight className="h-3 w-3" /> QField
          </span>
        );
      case 'bidirectional':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
            Bidirectional
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.type.replace('_', ' ').charAt(0).toUpperCase() + job.type.slice(1).replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getDirectionBadge(job.direction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(job.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600" title="Created">
                      +{job.recordsCreated}
                    </span>
                    <span className="text-blue-600" title="Updated">
                      ↻{job.recordsUpdated}
                    </span>
                    {job.recordsFailed > 0 && (
                      <span className="text-red-600" title="Failed">
                        ✕{job.recordsFailed}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.duration ? `${Math.round(job.duration / 1000)}s` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(job.startedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}