// Main Foto Reviews Dashboard component

'use client';

import React, { useState } from 'react';
import { usePendingReviews } from '../hooks/useFotoReviews';
import { PendingReviewsList } from './PendingReviewsList';
import type { ReviewFilters, ApprovalStatus } from '../types/fotoReviews.types';

export function FotoReviewsDashboard() {
  const [filters, setFilters] = useState<ReviewFilters>({
    status: 'pending_review',
  });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { reviews, total, loading, error, refetch } = usePendingReviews(filters, page, 20);

  const handleStatusChange = (status: ApprovalStatus) => {
    setFilters({ ...filters, status });
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters({ ...filters, search: undefined });
    setPage(1);
  };

  const statusCounts = {
    pending_review: reviews.filter((r) => r.status === 'pending_review').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
    sent: reviews.filter((r) => r.status === 'sent').length,
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <h3 className="font-semibold">Error loading reviews</h3>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Foto Reviews</h1>
          <p className="text-gray-600 mt-1">
            Review AI-generated feedback before sending to WhatsApp
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1">
        <button
          onClick={() => handleStatusChange('pending_review')}
          className={`flex-1 px-4 py-3 rounded-md transition-colors ${
            filters.status === 'pending_review'
              ? 'bg-yellow-100 text-yellow-800 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="text-sm">Pending</div>
          <div className="text-2xl font-bold">{total}</div>
        </button>
        <button
          onClick={() => handleStatusChange('approved')}
          className={`flex-1 px-4 py-3 rounded-md transition-colors ${
            filters.status === 'approved'
              ? 'bg-green-100 text-green-800 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="text-sm">Approved</div>
          <div className="text-2xl font-bold">{statusCounts.approved}</div>
        </button>
        <button
          onClick={() => handleStatusChange('rejected')}
          className={`flex-1 px-4 py-3 rounded-md transition-colors ${
            filters.status === 'rejected'
              ? 'bg-red-100 text-red-800 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="text-sm">Rejected</div>
          <div className="text-2xl font-bold">{statusCounts.rejected}</div>
        </button>
        <button
          onClick={() => handleStatusChange('sent')}
          className={`flex-1 px-4 py-3 rounded-md transition-colors ${
            filters.status === 'sent'
              ? 'bg-blue-100 text-blue-800 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="text-sm">Sent</div>
          <div className="text-2xl font-bold">{statusCounts.sent}</div>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by DR number..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        {filters.search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Reviews List */}
      <PendingReviewsList reviews={reviews} loading={loading} onRefresh={refetch} />

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} reviews
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
