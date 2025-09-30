'use client';

import React, { useState, useEffect } from 'react';
import {
  DropWithDetails,
  ChecklistItem,
  ChecklistValidation,
  CHECKLIST_TEMPLATE
} from '../types';

interface ChecklistReviewModalProps {
  drop: DropWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (reviewData: {
    submission_id: string;
    reviewed_by: string;
    status: 'approved' | 'needs-rectification';
    feedback: string;
    missing_steps: number[];
    completion_score: number;
  }) => void;
}

const ChecklistReviewModal: React.FC<ChecklistReviewModalProps> = ({
  drop,
  isOpen,
  onClose,
  onSubmitReview
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [validation, setValidation] = useState<ChecklistValidation | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'needs-rectification'>('approved');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && drop.id) {
      fetchChecklist();
    }
  }, [isOpen, drop.id]);

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`/api/drops/${drop.id}/checklist`);
      const data = await response.json();
      setChecklist(data);

      // Validate checklist
      const validationResponse = await fetch(`/api/drops/${drop.id}/validate`);
      const validationData = await validationResponse.json();
      setValidation(validationData);

      // Pre-select missing steps if validation fails
      if (!validationData.is_valid) {
        setSelectedItems(validationData.missing_steps || []);
        setReviewStatus('needs-rectification');
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const handleItemSelection = (stepNumber: number) => {
    setSelectedItems(prev =>
      prev.includes(stepNumber)
        ? prev.filter(item => item !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const handleSubmitReview = async () => {
    if (!drop.submission) {
      alert('No submission found for this drop');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        submission_id: drop.submission.id,
        reviewed_by: 'current_user', // This should come from Clerk auth
        status: reviewStatus,
        feedback: feedback || generateFeedback(),
        missing_steps: selectedItems,
        completion_score: reviewStatus === 'approved' ? 100 : 0,
      };

      await onSubmitReview(reviewData);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = (): string => {
    if (selectedItems.length === 0) {
      return 'All checklist items completed successfully. Installation meets Velocity Fibre quality standards.';
    }

    const missingItems = selectedItems.map(stepNum => {
      const item = CHECKLIST_TEMPLATE.find(item => item.step_number === stepNum);
      return item ? `Step ${stepNum}: ${item.step_name}` : `Step ${stepNum}`;
    });

    return `The following checklist items require attention:\n\n${missingItems.join('\n')}\n\nPlease rectify these issues and resubmit for review.`;
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'A': return 'Pre-Install Context';
      case 'B': return 'Installation Execution';
      case 'C': return 'Assets & IDs';
      case 'D': return 'Verification';
      case 'E': return 'Customer Acceptance';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-green-100 text-green-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-purple-100 text-purple-800';
      case 'E': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Review Drop {drop.drop_number}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Drop Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Drop Number</label>
                <p className="text-lg font-semibold">{drop.drop_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Pole Number</label>
                <p className="text-lg font-semibold">{drop.pole_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contractor</label>
                <p className="text-lg font-semibold">{drop.contractor?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Completion</label>
                <p className="text-lg font-semibold">
                  {drop.completed_steps}/{drop.total_steps}
                  ({Math.round((drop.completed_steps / drop.total_steps) * 100)}%)
                </p>
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          {validation && (
            <div className={`mb-6 p-4 rounded-lg ${
              validation.is_valid
                ? 'bg-green-100 border border-green-300'
                : 'bg-red-100 border border-red-300'
            }`}>
              <h3 className="font-semibold mb-2">
                {validation.is_valid ? '✅ Checklist Complete' : '❌ Checklist Incomplete'}
              </h3>
              {!validation.is_valid && (
                <div>
                  <p className="text-sm mb-2">
                    Missing {validation.missing_steps.length} of {validation.total_steps} items
                  </p>
                  {validation.issues.length > 0 && (
                    <div className="text-sm">
                      <strong>Issues:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validation.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist Items by Phase */}
          <div className="space-y-6 mb-6">
            {['A', 'B', 'C', 'D', 'E'].map((phase) => {
              const phaseItems = checklist.filter(item => item.phase === phase);
              if (phaseItems.length === 0) return null;

              return (
                <div key={phase}>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-3 ${getPhaseColor(phase)}`}>
                    Phase {phase}: {getPhaseName(phase)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phaseItems.map((item) => (
                      <div
                        key={item.step_number}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedItems.includes(item.step_number)
                            ? 'border-red-300 bg-red-50'
                            : item.is_completed
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => handleItemSelection(item.step_number)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedItems.includes(item.step_number)
                                ? 'border-red-500 bg-red-500 text-white'
                                : item.is_completed
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300'
                            }`}>
                              {selectedItems.includes(item.step_number) ? '✗' : item.is_completed ? '✓' : item.step_number}
                            </div>
                            <div>
                              <div className="font-medium">Step {item.step_number}: {item.step_name}</div>
                              <div className="text-sm text-gray-500">{CHECKLIST_TEMPLATE.find(t => t.step_number === item.step_number)?.description || ''}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Status
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="approved"
                    checked={reviewStatus === 'approved'}
                    onChange={(e) => setReviewStatus(e.target.value as 'approved')}
                    className="mr-2"
                  />
                  Approved
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="needs-rectification"
                    checked={reviewStatus === 'needs-rectification'}
                    onChange={(e) => setReviewStatus(e.target.value as 'needs-rectification')}
                    className="mr-2"
                  />
                  Needs Rectification
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={generateFeedback()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : reviewStatus === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Submitting...' : reviewStatus === 'approved' ? 'Approve' : 'Request Rectification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistReviewModal;