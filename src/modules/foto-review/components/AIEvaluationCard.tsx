/**
 * AI Evaluation Card Component
 * Displays AI evaluation results summary
 * Shows overall status, score, and step counts
 */

'use client';

import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Evaluation</h3>
        {evaluation && getStatusIcon(evaluation.overall_status)}
      </div>

      {/* Evaluation Results */}
      {evaluation ? (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2">
            <div>
              <p className="text-sm text-gray-600">Overall Status</p>
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
              <p className="text-sm text-gray-600">Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(evaluation.average_score)}`}>
                {evaluation.average_score.toFixed(1)}/10
              </p>
            </div>
          </div>

          {/* Step Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Steps Passed</p>
              <p className="text-2xl font-bold text-green-600">{evaluation.passed_steps}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Steps Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {evaluation.total_steps - evaluation.passed_steps}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>
                {evaluation.passed_steps}/{evaluation.total_steps} steps
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  evaluation.overall_status === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${(evaluation.passed_steps / evaluation.total_steps) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            {/* Re-evaluate Button */}
            <button
              onClick={onEvaluate}
              disabled={isEvaluating}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                  <span>Re-evaluating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-evaluate</span>
                </>
              )}
            </button>

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
            <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No evaluation yet</p>
            <p className="text-sm text-gray-500">Run AI evaluation to see results</p>
          </div>

          <button
            onClick={onEvaluate}
            disabled={isEvaluating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isEvaluating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Evaluate with AI</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
