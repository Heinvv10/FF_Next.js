'use client';

import React, { useState, useEffect } from 'react';
import { DropWithDetails } from '../types';

interface DropsTableProps {
  drops: DropWithDetails[];
  onReviewDrop: (drop: DropWithDetails) => void;
  onRefresh?: () => void;
}

const DropsTable: React.FC<DropsTableProps> = ({ drops, onReviewDrop, onRefresh }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [filteredDrops, setFilteredDrops] = useState<DropWithDetails[]>(drops);

  useEffect(() => {
    let filtered = drops;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(drop => drop.qc_status === filter);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(drop =>
        drop.drop_number.toLowerCase().includes(search.toLowerCase()) ||
        drop.pole_number.toLowerCase().includes(search.toLowerCase()) ||
        drop.customer_address.toLowerCase().includes(search.toLowerCase()) ||
        drop.contractor?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDrops(filtered);
  }, [drops, filter, search]);

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

  const getCompletionColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
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

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search drops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Drops</h3>
          <p className="text-2xl font-bold text-gray-900">{drops.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {drops.filter(d => d.qc_status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            {drops.filter(d => d.qc_status === 'approved').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Needs Rectification</h3>
          <p className="text-2xl font-bold text-red-600">
            {drops.filter(d => d.qc_status === 'needs-rectification').length}
          </p>
        </div>
      </div>

      {/* Drops Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QC Status
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
                    {drop.contractor ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {drop.contractor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {drop.contractor.whatsapp_number}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No contractor</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(drop.qc_status)}`}>
                      {drop.qc_status.replace('-', ' ')}
                    </span>
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
                      onClick={() => onReviewDrop(drop)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Review
                    </button>
                    {drop.review && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        drop.review.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrops.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No drops found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropsTable;