'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DropWithDetails } from '@/modules/drops-quality-control/types';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';

const ContractorDropsPortal: React.FC = () => {
  const router = useRouter();
  const [drops, setDrops] = useState<DropWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchContractorDrops();
  }, []);

  const fetchContractorDrops = async () => {
    try {
      setLoading(true);
      // In a real implementation, we'd get the contractor ID from authentication
      // For now, we'll fetch all drops and they'd be filtered by contractor ID on the backend
      const response = await fetch('/api/drops');
      const data = await response.json();
      setDrops(data);
    } catch (error) {
      console.error('Error fetching drops:', error);
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
    const matchesSearch = drop.drop_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drop.pole_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drop.customer_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || drop.qc_status === statusFilter;
    return matchesSearch && matchesStatus;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your DROPS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DROPS Contractor Portal</h1>
              <p className="text-sm text-gray-500">Manage your fiber installation quality</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Submission</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by drop number, pole, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'needs-rectification'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                    statusFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
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
                        onClick={() => router.push(`/contractor/drops/${drop.id}`)}
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
                {searchTerm || statusFilter !== 'all'
                  ? 'No drops match your search criteria.'
                  : 'No drops assigned to you yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
                <p className="mt-2 font-semibold text-blue-900">
                  Critical: Jobs marked "Needs Rectification" require immediate attention to avoid payment delays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDropsPortal;