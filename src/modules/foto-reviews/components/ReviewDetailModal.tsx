// Review detail modal component

'use client';

import React, { useState } from 'react';
import { useReviewDetails, useApprovalHistory, useReviewActions } from '../hooks/useFotoReviews';
import { FeedbackEditor } from './FeedbackEditor';
import { ApprovalControls } from './ApprovalControls';
import { ReviewHistory } from './ReviewHistory';

interface ReviewDetailModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewDetailModal({ jobId, onClose, onSuccess }: ReviewDetailModalProps) {
  const { review, loading: reviewLoading } = useReviewDetails(jobId);
  const { history, loading: historyLoading } = useApprovalHistory(jobId);
  const { approveReview, rejectReview, sendToWhatsApp, loading: actionLoading } = useReviewActions();

  const [mode, setMode] = useState<'view' | 'edit' | 'reject'>('view');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
  const [imageZoomed, setImageZoomed] = useState(false);

  if (reviewLoading || !review) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading review details...</div>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    const success = await approveReview(jobId);
    if (success) {
      const sent = await sendToWhatsApp(jobId);
      if (sent) {
        onSuccess();
        onClose();
      }
    }
  };

  const handleEditAndApprove = async (editedFeedback: string) => {
    const success = await approveReview(jobId, editedFeedback);
    if (success) {
      const sent = await sendToWhatsApp(jobId);
      if (sent) {
        onSuccess();
        onClose();
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    const success = await rejectReview(jobId, rejectionReason);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sent: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const imagePath = review.result?.image_path;
  const imageUrl = imagePath ? `/api/foto-reviews/image?path=${encodeURIComponent(imagePath)}` : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Review: {review.dr_number}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-600">{review.project}</span>
              {getStatusBadge(review.status)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('review')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'review'
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Image */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Property Photo</h3>
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={review.dr_number}
                      className={`w-full rounded-lg border border-gray-300 ${imageZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={() => setImageZoomed(!imageZoomed)}
                    />
                    {imageZoomed && (
                      <div
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        onClick={() => setImageZoomed(false)}
                      >
                        <img
                          src={imageUrl}
                          alt={review.dr_number}
                          className="max-w-full max-h-full"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-500">
                    No image available
                  </div>
                )}
              </div>

              {/* Right Column - Review Results */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">AI Review Results</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Score</div>
                        <div className="text-2xl font-bold">{review.result?.score || 0}/10</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Confidence</div>
                        <div className="text-2xl font-bold">
                          {Math.round((review.result?.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className="text-lg font-semibold">
                        {review.result?.passed ? (
                          <span className="text-green-600">PASSED</span>
                        ) : (
                          <span className="text-red-600">FAILED</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {review.result?.issues && review.result.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Issues Detected:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {review.result.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Recommendation:</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800">{review.result?.recommendation || review.original_feedback}</p>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="border-t pt-6">
                  {mode === 'view' && review.status === 'pending_review' && (
                    <ApprovalControls
                      onApprove={handleApprove}
                      onEdit={() => setMode('edit')}
                      onReject={() => setMode('reject')}
                      loading={actionLoading}
                    />
                  )}

                  {mode === 'edit' && (
                    <FeedbackEditor
                      originalFeedback={review.original_feedback}
                      editedFeedback={review.edited_feedback || undefined}
                      onSave={handleEditAndApprove}
                      onCancel={() => setMode('view')}
                      loading={actionLoading}
                    />
                  )}

                  {mode === 'reject' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Why is this review being rejected?"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setMode('view')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={actionLoading || !rejectionReason.trim()}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <ReviewHistory history={history} loading={historyLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
