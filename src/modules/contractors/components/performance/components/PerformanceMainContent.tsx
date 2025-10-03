/**
 * Performance Main Content Component
 * Main dashboard content with charts and leaderboards
 * @module PerformanceDashboard
 */

import React from 'react';
import { RAGScoreChart } from './RAGScoreChart';
import { TrendIndicators } from './TrendIndicators';
import { PerformanceLeaderboard } from './PerformanceLeaderboard';
import { ComparativeAnalysisChart } from './ComparativeAnalysisChart';
import { PerformanceDashboardData } from '../types';

interface PerformanceMainContentProps {
  data: PerformanceDashboardData;
  config: any;
  onContractorSelect: (contractorId: string) => void;
}

export function PerformanceMainContent({
  data,
  config,
  onContractorSelect
}: PerformanceMainContentProps) {
  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RAG Score Distribution */}
        <div className="lg:col-span-1">
          <RAGScoreChart
            data={[
              { name: 'Low Risk', value: data.ragDistribution.byRisk.low, percentage: 0, color: config.chartColors.low },
              { name: 'Medium Risk', value: data.ragDistribution.byRisk.medium, percentage: 0, color: config.chartColors.medium },
              { name: 'High Risk', value: data.ragDistribution.byRisk.high, percentage: 0, color: config.chartColors.high }
            ]}
            title="RAG Risk Distribution"
            showLegend
            height={300}
          />
        </div>

        {/* Trend Indicators */}
        <div className="lg:col-span-2">
          <TrendIndicators
            trends={data.trends}
            showDetails
          />
        </div>
      </div>

      {/* Performance Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceLeaderboard
          topPerformers={data.leaderboards.topPerformers}
          bottomPerformers={data.leaderboards.bottomPerformers}
          limit={config.displayOptions.leaderboardLimit}
          onContractorClick={onContractorSelect}
          showTrends
        />

        {/* Comparative Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ComparativeAnalysisChart
            comparativeData={data.comparativeAnalysis}
            className="h-80"
          />
        </div>
      </div>
    </>
  );
}