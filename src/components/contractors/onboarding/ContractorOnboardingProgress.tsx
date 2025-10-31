/**
 * Contractor Onboarding Progress Component
 * Displays overall onboarding progress with visual progress bar
 */

'use client';

import React from 'react';

export interface OnboardingProgress {
  totalStages: number;
  completedStages: number;
  inProgressStages: number;
  pendingStages: number;
  overallProgress: number;
  isComplete: boolean;
}

interface ContractorOnboardingProgressProps {
  progress: OnboardingProgress;
  showDetails?: boolean;
}

export function ContractorOnboardingProgress({
  progress,
  showDetails = true,
}: ContractorOnboardingProgressProps) {
  const getProgressColor = () => {
    if (progress.overallProgress === 100) return 'bg-green-600';
    if (progress.overallProgress >= 50) return 'bg-blue-600';
    return 'bg-yellow-600';
  };

  const getStatusBadge = () => {
    if (progress.isComplete) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Complete
        </span>
      );
    }
    if (progress.inProgressStages > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Not Started
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress</h3>
        {getStatusBadge()}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {progress.completedStages} of {progress.totalStages} stages completed
          </span>
          <span className="text-sm font-medium text-gray-700">
            {progress.overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stage Breakdown */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.completedStages}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.inProgressStages}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {progress.pendingStages}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>
      )}

      {/* Complete Badge */}
      {progress.isComplete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">
            ✓ All onboarding stages completed
          </p>
        </div>
      )}
    </div>
  );
}
