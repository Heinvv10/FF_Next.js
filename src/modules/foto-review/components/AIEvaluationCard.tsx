/**
 * AI Evaluation Card Component
 * Displays AI evaluation results summary
 * Shows overall status, score, and step counts
 *
 * Updated to use FibreFlow premium components (VelocityButton, GlassCard)
 */

'use client';

import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { VelocityButton } from '@/components/ui/VelocityButton';
import type { AIEvaluationCardProps } from '../types';
import { FeedbackButton } from './FeedbackButton';

export function AIEvaluationCard({ dr_number, evaluation, isEvaluating, onEvaluate, onSendFeedback, isSendingFeedback }: AIEvaluationCardProps) {
  const getStatusColor = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' ? (
      <CheckCircle className="w-8 h-8 text-green-600" />
    ) : (
      <XCircle className="w-8 h-8 text-red-600" />
    );
  };

  return (
    <GlassCard variant="strong" elevation={3} rounded="lg" padding="lg" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">AI Evaluation</h3>
        {evaluation && getStatusIcon(evaluation.overall_status)}
      </div>

      {/* Evaluation Results */}
      {evaluation ? (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-white/20 bg-white/5">
            <div>
              <p className="text-sm text-gray-300">Overall Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    evaluation.overall_status
                  )}`}
                >
                  {evaluation.overall_status}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-sm text-gray-300">Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(evaluation.average_score)}`}>
                {evaluation.average_score.toFixed(1)}/10
              </p>
            </div>
          </div>

          {/* Step Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-300">Steps Passed</p>
              <p className="text-2xl font-bold text-green-400">{evaluation.passed_steps}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-300">Steps Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {evaluation.total_steps - evaluation.passed_steps}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Progress</span>
              <span>
                {evaluation.passed_steps}/{evaluation.total_steps} steps
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
              <div
                className={`h-3 rounded-full transition-all ${
                  evaluation.overall_status === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${(evaluation.passed_steps / evaluation.total_steps) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/20 space-y-3">
            {/* Re-evaluate Button */}
            <VelocityButton
              onClick={onEvaluate}
              disabled={isEvaluating}
              variant="glass"
              size="lg"
              className="w-full"
              loading={isEvaluating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isEvaluating ? 'Re-evaluating...' : 'Re-evaluate'}
            </VelocityButton>

            {/* Feedback Button */}
            {dr_number && onSendFeedback && (
              <FeedbackButton
                dr_number={dr_number}
                evaluation={evaluation}
                onSendFeedback={onSendFeedback}
                isSending={isSendingFeedback}
              />
            )}
          </div>
        </div>
      ) : (
        /* No Evaluation Yet */
        <div className="space-y-4">
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <p className="text-gray-200 mb-2">No evaluation yet</p>
            <p className="text-sm text-gray-400">Run AI evaluation to see results</p>
          </div>

          <VelocityButton
            onClick={onEvaluate}
            disabled={isEvaluating}
            variant="glass-primary"
            size="lg"
            className="w-full"
            loading={isEvaluating}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isEvaluating ? 'Evaluating...' : 'Evaluate with AI'}
          </VelocityButton>
        </div>
      )}
    </GlassCard>
  );
}
