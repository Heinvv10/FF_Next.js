/**
 * Feedback Button Component
 * Handles sending WhatsApp feedback with preview dialog
 */

'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import type { FeedbackButtonProps } from '../types';

export function FeedbackButton({
  dr_number,
  evaluation,
  onSendFeedback,
  isSending,
  disabled,
}: FeedbackButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!evaluation) {
    return null;
  }

  const formatFeedbackMessage = () => {
    const statusEmoji = evaluation.overall_status === 'PASS' ? '✅' : '❌';
    const failedSteps = evaluation.step_results.filter((s) => !s.passed);

    let message = `${statusEmoji} Installation Photo Review: ${dr_number}\n\n`;
    message += `Overall Status: ${evaluation.overall_status}\n`;
    message += `Score: ${evaluation.average_score.toFixed(1)}/10\n`;
    message += `Steps Passed: ${evaluation.passed_steps}/${evaluation.total_steps}\n\n`;

    if (failedSteps.length > 0) {
      message += `❌ Failed Steps:\n`;
      failedSteps.forEach((step) => {
        message += `• ${step.step_label}: ${step.comment}\n`;
      });
      message += `\nPlease retake photos following installation guidelines.`;
    } else {
      message += `✅ All steps passed! Great work!`;
    }

    return message;
  };

  const handleSend = async () => {
    setShowPreview(false);
    await onSendFeedback(dr_number);
  };

  if (evaluation.feedback_sent) {
    return (
      <div className="text-center py-2 text-sm">
        <span className="text-green-600 font-medium">✓ Feedback sent</span>
        {evaluation.feedback_sent_at && (
          <p className="text-xs text-gray-500 mt-1">
            {new Date(evaluation.feedback_sent_at).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        disabled={disabled || isSending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Send Feedback</span>
          </>
        )}
      </button>

      {/* Preview Dialog */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Preview WhatsApp Message</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Preview */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {formatFeedbackMessage()}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
