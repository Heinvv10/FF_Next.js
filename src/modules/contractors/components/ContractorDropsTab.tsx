'use client';

import React, { useState, useEffect } from 'react';
import { DropWithDetails } from '@/modules/drops-quality-control/types';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Eye } from 'lucide-react';

interface ContractorDropsTabProps {
  contractorId: string;
}

const ContractorDropsTab: React.FC<ContractorDropsTabProps> = ({ contractorId }) => {
  const [drops, setDrops] = useState<DropWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchContractorDrops();
  }, [contractorId]);

  const fetchContractorDrops = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drops?contractor_id=${contractorId}`);
      const data = await response.json();
      setDrops(data);
    } catch (error) {
      console.error('Error fetching contractor drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'needs-rectification':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-rectification':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getCompletionColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredDrops = drops.filter(drop => {
    if (filter === 'all') return true;
    return drop.qc_status === filter;
  });

  const stats = {
    total: drops.length,
    pending: drops.filter(d => d.qc_status === 'pending').length,
    approved: drops.filter(d => d.qc_status === 'approved').length,
    needsRectification: drops.filter(d => d.qc_status === 'needs-rectification').length,
    averageCompletion: drops.length > 0
      ? Math.round(drops.reduce((sum, drop) => sum + (drop.completed_steps / drop.total_steps), 0) / drops.length * 100)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading DROPS data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DROPS Quality Control</h2>
          <p className="text-gray-600 mt-1">
            Manage your fiber installation quality and review feedback
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Drops</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Fix</p>
              <p className="text-2xl font-bold text-gray-900">{stats.needsRectification}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Quality</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageCompletion}%</p>
            </div>
            <div className="text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'pending', 'approved', 'needs-rectification'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Drops List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checklist Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrops.map((drop) => (
                <tr key={drop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{drop.drop_number}</div>
                      <div className="text-sm text-gray-500">Pole: {drop.pole_number}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {drop.customer_address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(drop.qc_status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(drop.qc_status)}`}>
                        {drop.qc_status.replace('-', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              drop.completed_steps === drop.total_steps
                                ? 'bg-green-500'
                                : drop.completed_steps >= drop.total_steps * 0.7
                                ? 'bg-blue-500'
                                : drop.completed_steps >= drop.total_steps * 0.5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{
                              width: `${(drop.completed_steps / drop.total_steps) * 100}%`
                            }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getCompletionColor(drop.completed_steps, drop.total_steps)}`}>
                          {drop.completed_steps}/{drop.total_steps}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((drop.completed_steps / drop.total_steps) * 100)}% complete
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(drop.qc_updated_at || drop.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        // TODO: Implement drop details view
                        console.log('View drop details:', drop.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrops.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No drops assigned to this contractor yet.'
                : `No drops with status "${filter.replace('-', ' ')}" found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Important Quality Notice
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                All install jobs must be fully documented with every photo and scan from the 14-step Velocity Fibre checklist.
                Any job submitted with missing or incomplete evidence will be marked as unpaid until rectified.
              </p>
              <p className="mt-1">
                <strong>Status Definitions:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Pending:</strong> Awaiting agent review</li>
                <li><strong>Approved:</strong> Installation meets quality standards</li>
                <li><strong>Needs Rectification:</strong> Missing items - fix and resubmit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDropsTab;