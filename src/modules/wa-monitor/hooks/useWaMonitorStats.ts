/**
 * WA Monitor Stats Hooks
 * Custom hooks for fetching WA Monitor statistics
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Fetch all projects WA Monitor summary (today's stats)
 */
export function useWaMonitorSummary() {
  return useQuery({
    queryKey: ['wa-monitor-summary'],
    queryFn: async () => {
      const response = await fetch('/api/wa-monitor-projects-summary');
      if (!response.ok) {
        throw new Error('Failed to fetch WA Monitor summary');
      }
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Fetch stats for a specific project
 */
export function useProjectWaStats(projectName: string | null) {
  return useQuery({
    queryKey: ['wa-monitor-project-stats', projectName],
    queryFn: async () => {
      if (!projectName) return null;

      const response = await fetch(`/api/wa-monitor-project-stats?project=${encodeURIComponent(projectName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project WA stats');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!projectName, // Only fetch if projectName is provided
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 30000,
  });
}
