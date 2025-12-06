/**
 * Evaluation Results Component
 * Displays detailed step-by-step evaluation breakdown
 * Shows individual scores and AI comments for each step
 */

'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import type { EvaluationResultsProps } from '../types';

export function EvaluationResults({ evaluation }: EvaluationResultsProps) {
  if (!evaluation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No evaluation results to display</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Step Results</h3>
        <p className="text-sm text-gray-600 mt-1">AI evaluation for each installation step</p>
      </div>

      {/* Step Results */}
      <div className="divide-y">
        {evaluation.step_results.map((step, index) => (
          <div key={step.step_number} className="p-6 hover:bg-gray-50 transition-colors">
            {/* Step Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {/* Status Icon */}
                {step.passed ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}

                {/* Step Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Step {step.step_number}</span>
                    <span className={`text-xs font-semibold ${step.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {step.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mt-1">{step.step_label}</h4>
                </div>
              </div>

              {/* Score Badge */}
              <div className={`ml-4 flex-shrink-0 px-3 py-1 rounded-full ${getScoreColor(step.score)}`}>
                <span className={`text-sm font-bold ${getScoreTextColor(step.score)}`}>
                  {step.score.toFixed(1)}/10
                </span>
              </div>
            </div>

            {/* AI Comment */}
            <div className="ml-9 mt-2">
              <p className="text-sm text-gray-700 leading-relaxed">{step.comment}</p>
            </div>

            {/* Score Bar */}
            <div className="ml-9 mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    step.passed ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(step.score / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Markdown Report (if available) */}
      {evaluation.markdown_report && (
        <div className="p-6 border-t bg-gray-50">
          <details className="cursor-pointer">
            <summary className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
              View Full Markdown Report
            </summary>
            <div className="mt-4 bg-white rounded-lg p-4 border">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {evaluation.markdown_report}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
