/**
 * RAG API Service
 * Frontend service for fetching RAG status
 */

import type { ContractorRagStatus, RagSummaryStats } from '../types/rag.types';

const API_BASE = '/api/contractors-rag';

// ==================== GET RAG Status ====================

/**
 * Get RAG status for a specific contractor
 */
export async function getContractorRagStatus(
  contractorId: string
): Promise<ContractorRagStatus> {
  const response = await fetch(`${API_BASE}?contractorId=${contractorId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Get RAG status for all contractors
 */
export async function getAllContractorsRagStatus(): Promise<{
  data: ContractorRagStatus[];
  summary: RagSummaryStats;
}> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    data: result.data || [],
    summary: result.summary || {}
  };
}
