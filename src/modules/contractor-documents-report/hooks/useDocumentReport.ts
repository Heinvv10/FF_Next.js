/**
 * Custom Hooks for Document Reports
 *
 * React hooks for fetching and managing document report data
 */

import { useState, useEffect } from 'react';
import type {
  ContractorDocumentReport,
  AllContractorsSummary,
} from '../types/documentReport.types';
import {
  fetchContractorDocumentReport,
  fetchAllContractorsSummary,
} from '../services/documentReportApiService';

/**
 * Hook to fetch a single contractor's document report
 */
export function useContractorDocumentReport(contractorId: string | null) {
  const [data, setData] = useState<ContractorDocumentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const report = await fetchContractorDocumentReport(contractorId);
        if (mounted) {
          setData(report);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load report');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      mounted = false;
    };
  }, [contractorId]);

  return { data, loading, error };
}

/**
 * Hook to fetch all contractors summary
 */
export function useAllContractorsSummary() {
  const [data, setData] = useState<AllContractorsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await fetchAllContractorsSummary();
        if (mounted) {
          setData(summary);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load summary');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
