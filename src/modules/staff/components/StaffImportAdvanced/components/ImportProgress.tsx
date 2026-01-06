/**
 * Import Progress Component
 * Displays import progress and status information
 */

import { ImportProgress as ImportProgressType } from '../types/importAdvanced.types';
import { getStatusColor, getStatusText } from '../utils/importUtils';

interface ImportProgressProps {
  progress: ImportProgressType;
}

export function ImportProgress({ progress }: ImportProgressProps) {
  if (progress.status === 'idle') return null;

  return (
    <div className="mt-6 p-4 bg-[var(--ff-bg-tertiary)] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${getStatusColor(progress.status)}`}>
          {getStatusText(progress.status)}
        </span>
        {progress.total > 0 && (
          <span className="text-sm text-[var(--ff-text-secondary)]">
            {progress.processed} / {progress.total}
          </span>
        )}
      </div>
      {progress.total > 0 && (
        <div className="w-full bg-[var(--ff-border-light)] rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.processed / progress.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}