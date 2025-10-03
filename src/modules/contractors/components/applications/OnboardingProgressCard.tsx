/**
 * OnboardingProgressCard Component - Visual progress indicators for contractor onboarding
 * Displays completion status, stage progress, and document requirements
 * Refactored for constitutional compliance using composition pattern
 */

import React from 'react';
import { ApplicationProgress, DocumentCompletionStatus } from '@/types/contractor.types';
import {
  calculateProgressStats,
  getProgressStatus,
  getDaysUntilCompletion
} from './utils/progressUtils';
import { CompactProgressCard } from './components/CompactProgressCard';
import { FullProgressCard } from './components/FullProgressCard';

// 🟢 WORKING: Props interface for OnboardingProgressCard
interface OnboardingProgressCardProps {
  /** Contractor's onboarding progress data */
  progress: ApplicationProgress;
  /** Company name for display */
  companyName: string;
  /** Contact person name */
  contactPerson: string;
  /** Document completion status */
  documents?: DocumentCompletionStatus[];
  /** Estimated completion date */
  estimatedCompletion?: Date;
  /** Show detailed stage breakdown */
  showStages?: boolean;
  /** Compact mode for table display */
  compact?: boolean;
  /** Click handler for navigation */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OnboardingProgressCard Component
 * Provides visual representation of contractor onboarding progress
 * Refactored using composition pattern for constitutional compliance
 */
export function OnboardingProgressCard({
  progress,
  companyName,
  contactPerson,
  documents = [],
  estimatedCompletion,
  showStages = false,
  compact = false,
  onClick,
  className = ''
}: OnboardingProgressCardProps) {
  // Calculate progress data using extracted utilities
  const progressStats = calculateProgressStats(progress, documents);
  const statusInfo = getProgressStatus(progressStats.overall);
  const completionDays = getDaysUntilCompletion(estimatedCompletion);

  // Use appropriate sub-component based on mode
  if (compact) {
    return (
      <CompactProgressCard
        companyName={companyName}
        contactPerson={contactPerson}
        progressStats={progressStats}
        statusInfo={statusInfo}
        completionDays={completionDays}
        onClick={onClick}
        className={className}
      />
    );
  }

  return (
    <FullProgressCard
      companyName={companyName}
      contactPerson={contactPerson}
      progressStats={progressStats}
      statusInfo={statusInfo}
      completionDays={completionDays}
      stages={progress.stages}
      lastActivity={progress.lastActivity}
      showStages={showStages}
      className={className}
      onClick={onClick}
    />
  );
}

export default OnboardingProgressCard;