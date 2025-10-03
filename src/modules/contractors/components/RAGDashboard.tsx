/**
 * RAGDashboard Component - Risk Assessment and Grading dashboard
 * Following FibreFlow patterns and keeping under 250 lines
 */

import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, Shield, DollarSign, Clock, Users } from 'lucide-react';
import { RAGScoreDetails, ContractorRAGRanking } from '@/types/contractor.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { log } from '@/lib/logger';

interface RAGDashboardProps {
  contractorId?: string;
  showRankings?: boolean;
}

export function RAGDashboard({ contractorId, showRankings = false }: RAGDashboardProps) {
  const [ragScore, _setRAGScore] = useState<RAGScoreDetails | null>(null);
  const [rankings, _setRankings] = useState<ContractorRAGRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRAGData();
  }, [contractorId, showRankings]);

  const loadRAGData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement RAG scoring in client service
      // if (contractorId) {
      //   const score = await contractorClientService.calculateRAGScore(contractorId);
      //   setRAGScore(score);
      // }
      // 
      // if (showRankings) {
      //   const rankedContractors = await contractorClientService.getRankedContractors(10);
      //   setRankings(rankedContractors);
      // }
      
      // For now, show placeholder message
      log.info('RAG functionality temporarily disabled for client safety', undefined, 'RAGDashboard');
    } catch (error) {
      log.error('Failed to load RAG data:', { data: error }, 'RAGDashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      low: 'text-green-700 bg-green-100',
      medium: 'text-yellow-700 bg-yellow-100',
      high: 'text-red-700 bg-red-100'
    };
    return colors[risk as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading RAG analysis..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Individual RAG Score */}
      {ragScore && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">RAG Assessment</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(ragScore.risk)}`}>
              {ragScore.risk.toUpperCase()} RISK
            </div>
          </div>

          {/* Overall Score */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getScoreIcon(ragScore.overall)}
                <div>
                  <h4 className="font-medium text-gray-900">Overall RAG Score</h4>
                  <p className="text-sm text-gray-600">Risk-adjusted performance rating</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(ragScore.overall)}`}>
                {ragScore.overall}
              </div>
            </div>
          </div>

          {/* Component Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 border border-gray-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Performance</p>
              <p className={`text-xl font-bold ${getScoreColor(ragScore.performance)}`}>
                {ragScore.performance}
              </p>
            </div>
            
            <div className="text-center p-3 border border-gray-200 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Financial</p>
              <p className={`text-xl font-bold ${getScoreColor(ragScore.financial)}`}>
                {ragScore.financial}
              </p>
            </div>
            
            <div className="text-center p-3 border border-gray-200 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Reliability</p>
              <p className={`text-xl font-bold ${getScoreColor(ragScore.reliability)}`}>
                {ragScore.reliability}
              </p>
            </div>
            
            <div className="text-center p-3 border border-gray-200 rounded-lg">
              <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Capabilities</p>
              <p className={`text-xl font-bold ${getScoreColor(ragScore.capabilities)}`}>
                {ragScore.capabilities}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {ragScore.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {ragScore.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Rankings */}
      {showRankings && rankings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Contractors by RAG Score</h3>
          </div>

          <div className="space-y-3">
            {rankings.map((ranking, index) => (
              <div key={ranking.contractorId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ranking.companyName}</p>
                    <p className={`text-sm px-2 py-1 rounded ${getRiskColor(ranking.ragScore.risk)}`}>
                      {ranking.ragScore.risk} risk
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-xl font-bold ${getScoreColor(ranking.ragScore.overall)}`}>
                    {ranking.ragScore.overall}
                  </p>
                  <p className="text-xs text-gray-500">RAG Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {ragScore && (
        <div className="text-center text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Last updated: {ragScore.lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
}