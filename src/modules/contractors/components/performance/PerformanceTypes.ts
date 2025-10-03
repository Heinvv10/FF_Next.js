/**
 * Types for contractor performance analytics
 */

export interface ContractorPerformance {
  id: string;
  companyName: string;
  performanceScore: number | null;
  safetyScore: number | null;
  qualityScore: number | null;
  timelinessScore: number | null;
  ragOverall: 'green' | 'amber' | 'red';
  ragFinancial: 'green' | 'amber' | 'red';
  ragCompliance: 'green' | 'amber' | 'red';
  ragPerformance: 'green' | 'amber' | 'red';
  ragSafety: 'green' | 'amber' | 'red';
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  cancelledProjects: number;
}

export interface PerformanceMetrics {
  overallPerformance: number;
  qualityScore: number;
  safetyScore: number;
  timelinessScore: number;
  projectCompletionRate: number;
  onTimeDeliveryRate: number;
  averageProjectDuration: number;
  contractorCount: number;
  ragDistribution: {
    green: number;
    amber: number;
    red: number;
  };
}

export interface PerformanceFilter {
  ragStatus: string;
  projectRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PerformanceTrend {
  date: string;
  overallPerformance: number;
  qualityScore: number;
  safetyScore: number;
  timelinessScore: number;
}