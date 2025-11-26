/**
 * Document Report API Service (Frontend)
 *
 * Frontend service for fetching document reports from API
 */

import type {
  ContractorDocumentReport,
  AllContractorsSummary,
} from '../types/documentReport.types';

const API_BASE = '/api';

/**
 * Handle API response and unwrap data
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error?.message || error.message || 'Request failed');
  }

  const json = await response.json();
  return json.data || json;
}

/**
 * Fetch document report for a single contractor
 */
export async function fetchContractorDocumentReport(
  contractorId: string
): Promise<ContractorDocumentReport> {
  const response = await fetch(
    `${API_BASE}/contractors-documents-report?contractorId=${contractorId}`
  );
  return handleResponse<ContractorDocumentReport>(response);
}

/**
 * Fetch summary for all contractors
 */
export async function fetchAllContractorsSummary(): Promise<AllContractorsSummary> {
  const response = await fetch(`${API_BASE}/contractors-documents-report-summary`);
  return handleResponse<AllContractorsSummary>(response);
}

/**
 * Export contractor document report as CSV
 */
export async function exportContractorReportCSV(contractorId: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/contractors-documents-export?contractorId=${contractorId}&format=csv`
  );

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

/**
 * Export contractor document report as PDF
 */
export async function exportContractorReportPDF(contractorId: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/contractors-documents-export?contractorId=${contractorId}&format=pdf`
  );

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
