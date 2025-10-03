/**
 * Progress calculation utilities for OnboardingProgressCard
 * Extracted to reduce component complexity and improve maintainability
 */

import { ApplicationProgress, DocumentCompletionStatus } from '@/types/contractor.types';

export interface ProgressStats {
  overall: number;
  completed: number;
  total: number;
  documentsUploaded: number;
  documentsRequired: number;
  documentsComplete: number;
  documentsExpiring: number;
  documentsExpired: number;
}

export interface ProgressStatus {
  status: 'complete' | 'near-complete' | 'in-progress' | 'started' | 'not-started';
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'gray';
  label: string;
}

export interface CompletionDays {
  days: number;
  overdue?: boolean;
  today?: boolean;
}

/**
 * Calculate comprehensive progress statistics
 */
export function calculateProgressStats(
  progress: ApplicationProgress,
  documents: DocumentCompletionStatus[] = []
): ProgressStats {
  return {
    overall: Math.round(progress.overallProgress),
    completed: progress.stagesCompleted,
    total: progress.totalStages,
    documentsUploaded: progress.documentsUploaded,
    documentsRequired: progress.documentsRequired,
    documentsComplete: documents.filter(doc => doc.uploaded && doc.approved !== false).length,
    documentsExpiring: documents.filter(doc => doc.isExpiringSoon).length,
    documentsExpired: documents.filter(doc => doc.isExpired).length
  };
}

/**
 * Determine progress status based on completion percentage
 */
export function getProgressStatus(progress: number): ProgressStatus {
  if (progress === 100) {
    return { status: 'complete', color: 'green', label: 'Complete' };
  } else if (progress >= 75) {
    return { status: 'near-complete', color: 'blue', label: 'Nearly Complete' };
  } else if (progress >= 50) {
    return { status: 'in-progress', color: 'yellow', label: 'In Progress' };
  } else if (progress >= 25) {
    return { status: 'started', color: 'orange', label: 'Started' };
  } else {
    return { status: 'not-started', color: 'gray', label: 'Not Started' };
  }
}

/**
 * Calculate days until completion
 */
export function getDaysUntilCompletion(estimatedCompletion?: Date): CompletionDays | null {
  if (!estimatedCompletion) return null;

  const now = new Date();
  const diffTime = estimatedCompletion.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), overdue: true };
  } else if (diffDays === 0) {
    return { days: 0, today: true };
  } else {
    return { days: diffDays };
  }
}

/**
 * Get progress bar CSS class based on status color
 */
export function getProgressBarClass(color: ProgressStatus['color']): string {
  switch (color) {
    case 'green':
      return 'bg-green-500';
    case 'blue':
      return 'bg-blue-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'orange':
      return 'bg-orange-500';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get status badge CSS classes based on status color
 */
export function getStatusBadgeClasses(color: ProgressStatus['color']): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'blue':
      return 'bg-blue-100 text-blue-800';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800';
    case 'orange':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get progress circle text color class
 */
export function getProgressTextColor(color: ProgressStatus['color']): string {
  switch (color) {
    case 'green':
      return 'text-green-500';
    case 'blue':
      return 'text-blue-500';
    case 'yellow':
      return 'text-yellow-500';
    case 'orange':
      return 'text-orange-500';
    default:
      return 'text-gray-300';
  }
}