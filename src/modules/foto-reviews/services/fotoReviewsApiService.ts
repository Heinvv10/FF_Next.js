// Frontend API service for Foto Reviews
// Handles all API calls to foto-reviews endpoints

import type {
  PendingReviewsResponse,
  ReviewDetailResponse,
  ApprovalHistoryEntry,
  ApproveReviewRequest,
  RejectReviewRequest,
  EditFeedbackRequest,
  SendToWhatsAppResponse,
  ReviewFilters,
} from '../types/fotoReviews.types';

class FotoReviewsApiService {
  private baseUrl = '/api/foto-reviews';

  /**
   * Handle API response and unwrap data
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get pending reviews with optional filters
   */
  async getPendingReviews(
    filters: ReviewFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PendingReviewsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters.status) params.append('status', filters.status);
    if (filters.project) params.append('project', filters.project);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${this.baseUrl}/pending?${params.toString()}`);
    return this.handleResponse<PendingReviewsResponse>(response);
  }

  /**
   * Get detailed review data for a specific job
   */
  async getReviewDetails(jobId: string): Promise<ReviewDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${jobId}`);
    return this.handleResponse<ReviewDetailResponse>(response);
  }

  /**
   * Get approval history for a job
   */
  async getApprovalHistory(jobId: string): Promise<ApprovalHistoryEntry[]> {
    const response = await fetch(`${this.baseUrl}/${jobId}/history`);
    return this.handleResponse<ApprovalHistoryEntry[]>(response);
  }

  /**
   * Approve a review
   */
  async approveReview(
    jobId: string,
    data: ApproveReviewRequest = {}
  ): Promise<{ job_id: string; status: string; reviewer_id: string; reviewer_name: string }> {
    const response = await fetch(`${this.baseUrl}/${jobId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  /**
   * Reject a review
   */
  async rejectReview(
    jobId: string,
    data: RejectReviewRequest
  ): Promise<{ job_id: string; status: string; rejection_reason: string }> {
    const response = await fetch(`${this.baseUrl}/${jobId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  /**
   * Edit feedback text
   */
  async editFeedback(
    jobId: string,
    data: EditFeedbackRequest
  ): Promise<{ job_id: string; edited_feedback: string }> {
    const response = await fetch(`${this.baseUrl}/${jobId}/edit-feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  /**
   * Send approved feedback to WhatsApp
   */
  async sendToWhatsApp(jobId: string): Promise<SendToWhatsAppResponse> {
    const response = await fetch(`${this.baseUrl}/${jobId}/send-to-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return this.handleResponse<SendToWhatsAppResponse>(response);
  }

  /**
   * Get image URL for a review
   */
  getImageUrl(imagePath: string): string {
    return `${this.baseUrl}/image?path=${encodeURIComponent(imagePath)}`;
  }
}

export const fotoReviewsApiService = new FotoReviewsApiService();
