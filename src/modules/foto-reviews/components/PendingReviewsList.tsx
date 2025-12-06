// Pending reviews list component

'use client';

import { useState } from 'react';
import type { FotoReview } from '../types/fotoReviews.types';
import { ReviewDetailModal } from './ReviewDetailModal';

interface PendingReviewsListProps {
  reviews: FotoReview[];
  loading?: boolean;
  onRefresh: () => void;
}

export function PendingReviewsList({ reviews, loading = false, onRefresh }: PendingReviewsListProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sent: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no reviews matching your filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.job_id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedJobId(review.job_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                    {review.dr_number}
                  </h3>
                  {getStatusBadge(review.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">{review.project}</span>
                  <span>•</span>
                  <span>Score: {review.ai_score}/10</span>
                  <span>•</span>
                  <span>Confidence: {Math.round(review.ai_confidence * 100)}%</span>
                  <span>•</span>
                  <span>{formatTimeAgo(review.queued_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJobId(review.job_id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedJobId && (
        <ReviewDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
