// Feedback editor component

'use client';

import React, { useState, useEffect } from 'react';

interface FeedbackEditorProps {
  originalFeedback: string;
  editedFeedback?: string;
  onSave: (feedback: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FeedbackEditor({
  originalFeedback,
  editedFeedback,
  onSave,
  onCancel,
  loading = false,
}: FeedbackEditorProps) {
  const [feedback, setFeedback] = useState(editedFeedback || originalFeedback);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFeedback(editedFeedback || originalFeedback);
  }, [originalFeedback, editedFeedback]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    setHasChanges(e.target.value !== originalFeedback);
  };

  const handleSave = () => {
    if (feedback.trim()) {
      onSave(feedback.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Edit Feedback
        </label>
        <textarea
          value={feedback}
          onChange={handleChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter feedback text..."
        />
      </div>

      {hasChanges && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          You have unsaved changes
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !feedback.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save & Approve'}
        </button>
      </div>
    </div>
  );
}
