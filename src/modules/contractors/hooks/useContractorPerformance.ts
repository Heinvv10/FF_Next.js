/**
 * Hook for managing contractor performance data and analytics
 */

import { useState, useEffect } from 'react';
import { ContractorPerformance, PerformanceMetrics, PerformanceFilter, PerformanceTrend } from '../components/performance/PerformanceTypes';

interface UseContractorPerformanceReturn {
  contractors: ContractorPerformance[];
  metrics: PerformanceMetrics;
  trends: PerformanceTrend[];
  filters: PerformanceFilter;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: Partial<PerformanceFilter>) => void;
  refreshData: () => Promise<void>;
}

export function useContractorPerformance(): UseContractorPerformanceReturn {
  const [contractors, setContractors] = useState<ContractorPerformance[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    overallPerformance: 0,
    qualityScore: 0,
    safetyScore: 0,
    timelinessScore: 0,
    projectCompletionRate: 0,
    onTimeDeliveryRate: 0,
    averageProjectDuration: 0,
    contractorCount: 0,
    ragDistribution: { green: 0, amber: 0, red: 0 },
  });
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [filters, setFiltersState] = useState<PerformanceFilter>({
    ragStatus: 'all',
    projectRange: 'all',
    sortBy: 'companyName',
    sortOrder: 'asc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load performance data
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/contractors');
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();

      // Transform contractor data to performance format
      const transformedContractors: ContractorPerformance[] = data.data.map((contractor: any) => ({
        id: contractor.id,
        companyName: contractor.companyName,
        performanceScore: contractor.performanceScore || 0,
        safetyScore: contractor.safetyScore || 0,
        qualityScore: contractor.qualityScore || 0,
        timelinessScore: contractor.timelinessScore || 0,
        ragOverall: contractor.ragOverall,
        ragFinancial: contractor.ragFinancial,
        ragCompliance: contractor.ragCompliance,
        ragPerformance: contractor.ragPerformance,
        ragSafety: contractor.ragSafety,
        totalProjects: contractor.totalProjects,
        completedProjects: contractor.completedProjects,
        activeProjects: contractor.activeProjects,
        cancelledProjects: contractor.cancelledProjects,
      }));

      // Apply filters
      const filteredContractors = filterContractors(transformedContractors, filters);
      setContractors(filteredContractors);

      // Calculate metrics
      const newMetrics = calculateMetrics(filteredContractors);
      setMetrics(newMetrics);

      // Generate mock trends (in real app, this would come from API)
      const mockTrends = generateMockTrends();
      setTrends(mockTrends);

    } catch (error) {
      setError(`Failed to load performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contractors based on current filters
  const filterContractors = (contractors: ContractorPerformance[], filter: PerformanceFilter): ContractorPerformance[] => {
    return contractors
      .filter(contractor => {
        // RAG status filter
        if (filter.ragStatus !== 'all' && contractor.ragOverall !== filter.ragStatus) {
          return false;
        }

        // Project range filter
        if (filter.projectRange !== 'all') {
          switch (filter.projectRange) {
            case 'high':
              return contractor.totalProjects >= 10;
            case 'medium':
              return contractor.totalProjects >= 5 && contractor.totalProjects < 10;
            case 'low':
              return contractor.totalProjects > 0 && contractor.totalProjects < 5;
            case 'none':
              return contractor.totalProjects === 0;
            default:
              return true;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filter.sortBy) {
          case 'performanceScore':
            aValue = a.performanceScore || 0;
            bValue = b.performanceScore || 0;
            break;
          case 'qualityScore':
            aValue = a.qualityScore || 0;
            bValue = b.qualityScore || 0;
            break;
          case 'safetyScore':
            aValue = a.safetyScore || 0;
            bValue = b.safetyScore || 0;
            break;
          case 'totalProjects':
            aValue = a.totalProjects;
            bValue = b.totalProjects;
            break;
          case 'completionRate':
            aValue = a.totalProjects > 0 ? a.completedProjects / a.totalProjects : 0;
            bValue = b.totalProjects > 0 ? b.completedProjects / b.totalProjects : 0;
            break;
          default:
            aValue = a.companyName;
            bValue = b.companyName;
        }

        if (typeof aValue === 'string') {
          return filter.sortOrder === 'asc' ?
            aValue.localeCompare(bValue) :
            bValue.localeCompare(aValue);
        }

        return filter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
  };

  // Calculate performance metrics
  const calculateMetrics = (contractors: ContractorPerformance[]): PerformanceMetrics => {
    if (contractors.length === 0) {
      return {
        overallPerformance: 0,
        qualityScore: 0,
        safetyScore: 0,
        timelinessScore: 0,
        projectCompletionRate: 0,
        onTimeDeliveryRate: 0,
        averageProjectDuration: 0,
        contractorCount: 0,
        ragDistribution: { green: 0, amber: 0, red: 0 },
      };
    }

    const totalProjects = contractors.reduce((sum, c) => sum + c.totalProjects, 0);
    const completedProjects = contractors.reduce((sum, c) => sum + c.completedProjects, 0);
    const activeProjects = contractors.reduce((sum, c) => sum + c.activeProjects, 0);

    const performanceScores = contractors
      .map(c => c.performanceScore || 0)
      .filter(score => score > 0);

    const qualityScores = contractors
      .map(c => c.qualityScore || 0)
      .filter(score => score > 0);

    const safetyScores = contractors
      .map(c => c.safetyScore || 0)
      .filter(score => score > 0);

    const timelinessScores = contractors
      .map(c => c.timelinessScore || 0)
      .filter(score => score > 0);

    const avgPerformance = performanceScores.length > 0 ?
      performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length : 0;

    const avgQuality = qualityScores.length > 0 ?
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;

    const avgSafety = safetyScores.length > 0 ?
      safetyScores.reduce((sum, score) => sum + score, 0) / safetyScores.length : 0;

    const avgTimeliness = timelinessScores.length > 0 ?
      timelinessScores.reduce((sum, score) => sum + score, 0) / timelinessScores.length : 0;

    const ragDistribution = contractors.reduce((acc, contractor) => {
      acc[contractor.ragOverall]++;
      return acc;
    }, { green: 0, amber: 0, red: 0 });

    return {
      overallPerformance: avgPerformance,
      qualityScore: avgQuality,
      safetyScore: avgSafety,
      timelinessScore: avgTimeliness,
      projectCompletionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      onTimeDeliveryRate: avgTimeliness, // Using timeliness score as proxy
      averageProjectDuration: 0, // Would need project date data
      contractorCount: contractors.length,
      ragDistribution,
    };
  };

  // Generate mock trend data for demonstration
  const generateMockTrends = (): PerformanceTrend[] => {
    const trends: PerformanceTrend[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        overallPerformance: Math.random() * 30 + 70, // 70-100%
        qualityScore: Math.random() * 25 + 75, // 75-100%
        safetyScore: Math.random() * 20 + 80, // 80-100%
        timelinessScore: Math.random() * 35 + 65, // 65-100%
      });
    }

    return trends;
  };

  // Update filters
  const setFilters = (newFilters: Partial<PerformanceFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  // Refresh data
  const refreshData = async () => {
    await loadPerformanceData();
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadPerformanceData();
  }, [filters.ragStatus, filters.projectRange, filters.sortBy, filters.sortOrder]);

  return {
    contractors,
    metrics,
    trends,
    filters,
    isLoading,
    error,
    setFilters,
    refreshData,
  };
}