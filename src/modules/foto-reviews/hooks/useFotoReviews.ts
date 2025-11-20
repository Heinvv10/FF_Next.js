// Custom hooks for Foto Reviews data fetching

import { useState, useEffect, useCallback } from 'react';
import { fotoReviewsApiService } from '../services/fotoReviewsApiService';
import type {
  FotoReview,
  ReviewDetailResponse,
  ApprovalHistoryEntry,
  ReviewFilters,
} from '../types/fotoReviews.types';

/**
 * Hook to fetch pending reviews with filters and pagination
 */
export function usePendingReviews(
  filters: ReviewFilters = {},
  page: number = 1,
  limit: number = 20
) {
  const [reviews, setReviews] = useState<FotoReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fotoReviewsApiService.getPendingReviews(filters, page, limit);
      setReviews(data.reviews);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, total, loading, error, refetch: fetchReviews };
}

/**
 * Hook to fetch review details for a specific job
 */
export function useReviewDetails(jobId: string | null) {
  const [review, setReview] = useState<ReviewDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    if (!jobId) {
      setReview(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fotoReviewsApiService.getReviewDetails(jobId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review details');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  return { review, loading, error, refetch: fetchReview };
}

/**
 * Hook to fetch approval history for a job
 */
export function useApprovalHistory(jobId: string | null) {
  const [history, setHistory] = useState<ApprovalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!jobId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fotoReviewsApiService.getApprovalHistory(jobId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

/**
 * Hook for review actions (approve, reject, edit, send)
 */
export function useReviewActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveReview = useCallback(async (jobId: string, editedFeedback?: string) => {
    try {
      setLoading(true);
      setError(null);
      await fotoReviewsApiService.approveReview(jobId, {
        edited_feedback: editedFeedback,
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve review');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectReview = useCallback(async (jobId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      await fotoReviewsApiService.rejectReview(jobId, { rejection_reason: reason });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject review');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const editFeedback = useCallback(async (jobId: string, editedFeedback: string) => {
    try {
      setLoading(true);
      setError(null);
      await fotoReviewsApiService.editFeedback(jobId, { edited_feedback: editedFeedback });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit feedback');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendToWhatsApp = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);
      await fotoReviewsApiService.sendToWhatsApp(jobId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send to WhatsApp');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approveReview,
    rejectReview,
    editFeedback,
    sendToWhatsApp,
    loading,
    error,
  };
}
