/**
 * Evaluation Panel Component
 * Shows AI evaluation results and allows human review/feedback
 * Similar to WA Monitor QA review cards
 */

'use client';

import { useState } from 'react';
import { Send, Sparkles, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { DropRecord, EvaluationResult } from '../types';

interface EvaluationPanelProps {
  drop: DropRecord;
  onEvaluate: (drNumber: string) => Promise<EvaluationResult>;
  onSendFeedback: (drNumber: string, message: string) => Promise<void>;
}

export function EvaluationPanel({ drop, onEvaluate, onSendFeedback }: EvaluationPanelProps) {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run AI evaluation
  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setError(null);
      const result = await onEvaluate(drop.dr_number);
      setEvaluation(result);

      // Auto-generate feedback message
      generateFeedbackMessage(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Evaluation failed';
      setError(errorMessage);
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Generate feedback message from evaluation results (similar to WA Monitor format)
  const generateFeedbackMessage = (result: EvaluationResult) => {
    // Handle both old format (results.results) and new format (step_results)
    const stepResults = result.step_results || result.results?.results || [];
    const passed = stepResults.filter((r: any) => r.passed === true || r.status === 'PASS');
    const failed = stepResults.filter((r: any) => r.passed === false || r.status === 'FAIL');

    let message = `${drop.dr_number}\n`;

    // If all steps pass - simple approval message
    if (failed.length === 0) {
      message += `All items complete! ✅`;
    } else {
      // Focus on what needs correction (similar to WA Monitor)
      message += `NEEDS CORRECTION\n\n`;

      // Show failed items with issues
      message += `Incorrect items:\n`;
      failed.forEach((item: any) => {
        const stepName = item.step_label || item.step || `Step ${item.step_number}`;
        const issue = item.comment || item.issues || 'Failed quality check';
        // Format similar to WA Monitor: "• Step Name - Issue description"
        message += `• ${stepName} - ${issue}\n`;
      });

      // Optional: Add any missing steps if needed
      const missingSteps = stepResults.filter((r: any) =>
        r.score === 0 || r.comment?.toLowerCase().includes('missing') || r.comment?.toLowerCase().includes('not found')
      );

      if (missingSteps.length > 0 && missingSteps.length !== failed.length) {
        message += `\nMissing items:\n`;
        missingSteps.forEach((item: any) => {
          const stepName = item.step_label || item.step || `Step ${item.step_number}`;
          message += `• ${stepName}\n`;
        });
      }
    }

    setFeedbackMessage(message);
  };

  // Send feedback to WhatsApp
  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      await onSendFeedback(drop.dr_number, feedbackMessage);
      alert('Feedback sent successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send feedback';
      setError(errorMessage);
      console.error('Send feedback error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Evaluation & Feedback
          </h3>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {evaluating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {evaluation ? 'Re-evaluate' : 'Run AI Evaluation'}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-3">
              {evaluation.overall_status === 'PASS' ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {evaluation.overall_score}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {evaluation.passed_steps} of {evaluation.total_steps} steps passed
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
              evaluation.overall_status === 'PASS'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {evaluation.overall_status}
            </div>
          </div>

          {/* Step Results */}
          {evaluation.step_results && evaluation.step_results.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Step-by-step Results:
              </p>
              {evaluation.step_results.map((step: any, index: number) => {
                const isPassed = step.passed === true || step.status === 'PASS';
                const stepName = step.step_label || step.step || `Step ${step.step_number}`;
                const comment = step.comment || step.issues || '';

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isPassed
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isPassed ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isPassed
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        }`}>
                          {stepName}
                        </p>
                        {comment && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {comment}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${
                        isPassed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {step.score ? `${Math.round(step.score * 10)}%` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Feedback Message Editor */}
      {evaluation && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              WhatsApp Feedback Message
            </label>
            <button
              onClick={() => generateFeedbackMessage(evaluation)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Regenerate
            </button>
          </div>

          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            placeholder="Edit feedback message before sending..."
          />

          <button
            onClick={handleSendFeedback}
            disabled={sending || !feedbackMessage.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {sending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Feedback to WhatsApp
              </>
            )}
          </button>
        </div>
      )}

      {/* Instructions (shown when no evaluation yet) */}
      {!evaluation && !evaluating && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Click "Run AI Evaluation" to analyze this DR's photos
          </p>
          <p className="text-xs mt-1">
            AI will check all 12 installation steps and generate feedback
          </p>
        </div>
      )}
    </div>
  );
}
