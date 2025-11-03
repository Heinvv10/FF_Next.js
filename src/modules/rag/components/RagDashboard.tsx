/**
 * RAG Dashboard Component
 * Main dashboard showing contractor RAG status
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllContractorsRagStatus } from '../services/ragApiService';
import type { ContractorRagStatus, RagSummaryStats, RagStatus } from '../types/rag.types';
import { RagSummaryCards } from './RagSummaryCards';
import { RagStatusBadge } from './RagStatusBadge';
import { RAG_CATEGORY_CONFIG } from '../types/rag.types';

export function RagDashboard() {
  const [contractors, setContractors] = useState<ContractorRagStatus[]>([]);
  const [summary, setSummary] = useState<RagSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RagStatus | 'all'>('all');

  useEffect(() => {
    loadRagData();
  }, []);

  async function loadRagData() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllContractorsRagStatus();
      setContractors(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error loading RAG data:', err);
      setError(err.message || 'Failed to load RAG status');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading RAG status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error loading RAG dashboard</span>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <button
          onClick={loadRagData}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return <div>No data available</div>;
  }

  const filteredContractors = filter === 'all'
    ? contractors
    : contractors.filter(c => c.overall === filter);

  return (
    <div>
      {/* Summary Cards */}
      <RagSummaryCards summary={summary} />

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({contractors.length})
        </button>
        <button
          onClick={() => setFilter('red')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'red'
              ? 'bg-red-600 text-white'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          🔴 Red ({summary.red})
        </button>
        <button
          onClick={() => setFilter('amber')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'amber'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          🟡 Amber ({summary.amber})
        </button>
        <button
          onClick={() => setFilter('green')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'green'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          🟢 Green ({summary.green})
        </button>
      </div>

      {/* Contractors Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contractor
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Overall
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {RAG_CATEGORY_CONFIG.financial.icon} Financial
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {RAG_CATEGORY_CONFIG.compliance.icon} Compliance
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {RAG_CATEGORY_CONFIG.performance.icon} Performance
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {RAG_CATEGORY_CONFIG.safety.icon} Safety
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContractors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No contractors found with {filter} status
                </td>
              </tr>
            ) : (
              filteredContractors.map((contractor: any) => (
                <tr key={contractor.contractorId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{contractor.companyName || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">ID: {contractor.contractorId.substring(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RagStatusBadge status={contractor.overall} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RagStatusBadge status={contractor.financial} showLabel={false} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RagStatusBadge status={contractor.compliance} showLabel={false} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RagStatusBadge status={contractor.performance} showLabel={false} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RagStatusBadge status={contractor.safety} showLabel={false} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
